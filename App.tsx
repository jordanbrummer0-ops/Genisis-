import React, { useState, useCallback, useEffect } from 'react';
import { ChatMessage, MessageAuthor, Project } from './types';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import InputBar from './components/InputBar';
import ProjectSidebar from './components/ProjectSidebar';
import CreateProjectModal from './components/CreateProjectModal';
import { useGeminiLive } from './hooks/useGeminiLive';
import { 
  generateTextResponse, 
  generateGroundedResponse, 
  generateComplexResponse, 
  editImage, 
  generateSpeech,
  generateLowLatencyResponse
} from './services/geminiService';
import { playAudio } from './services/audioService';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{ base64: string; mimeType: string } | null>(null);

  // Initialize with a default project on first load
  useEffect(() => {
    const initialProject: Project = {
      id: `proj-${Date.now()}`,
      name: 'General',
      chatHistory: [{
        id: 'welcome-msg',
        author: MessageAuthor.AI,
        text: "Welcome to Genesis Studio! Create a new project or start chatting here. You can talk to me, ask me to edit photos, or get real-time information. How can I help you?",
      }],
    };
    setProjects([initialProject]);
    setActiveProjectId(initialProject.id);
  }, []);

  const activeProject = projects.find(p => p.id === activeProjectId);

  const addMessageToActiveProject = (message: Omit<ChatMessage, 'id'>) => {
    if (!activeProjectId) return;
    setProjects(prevProjects => 
      prevProjects.map(p => 
        p.id === activeProjectId 
          ? { ...p, chatHistory: [...p.chatHistory, { ...message, id: Date.now().toString() }] }
          : p
      )
    );
  };

  const handleCreateProject = (projectName: string) => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: projectName,
      chatHistory: [{
        id: 'new-proj-welcome',
        author: MessageAuthor.AI,
        text: `Project "${projectName}" created. Ready when you are!`,
      }],
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setIsModalOpen(false);
  };

  const handleSpeech = useCallback(async (text: string) => {
    try {
      const audioBase64 = await generateSpeech(text);
      if (audioBase64) {
        await playAudio(audioBase64);
      }
    } catch (error) {
      console.error("Speech generation failed:", error);
    }
  }, []);

  const processUserMessage = useCallback(async (prompt: string) => {
    if ((!prompt.trim() && !uploadedImage) || !activeProjectId) return;

    setIsLoading(true);

    const userMessageText = prompt.trim() || "Image uploaded";
    addMessageToActiveProject({ author: MessageAuthor.USER, text: userMessageText, image: uploadedImage?.base64 });

    try {
      let aiResponseText: string = "";
      let aiResponseImage: string | undefined = undefined;
      let aiResponseSources: any[] | undefined = undefined;

      const lowerCasePrompt = prompt.toLowerCase();
      
      if (uploadedImage) {
        if (lowerCasePrompt.includes('edit') || lowerCasePrompt.includes('change') || lowerCasePrompt.includes('remove') || lowerCasePrompt.includes('add')) {
          const result = await editImage(prompt, uploadedImage.base64, uploadedImage.mimeType);
          aiResponseText = result.text || "Here is the edited image.";
          aiResponseImage = result.image;
        } else {
            // Default action for image upload without specific edit instruction
            aiResponseText = "Image received. What would you like me to do with it?";
        }
      } else if (lowerCasePrompt.includes('plan') || lowerCasePrompt.includes('campaign') || lowerCasePrompt.includes('detailed report')) {
        aiResponseText = await generateComplexResponse(prompt);
      } else if (lowerCasePrompt.includes('news') || lowerCasePrompt.includes('current events') || lowerCasePrompt.includes('who won') || lowerCasePrompt.includes('near me')) {
        const result = await generateGroundedResponse(prompt);
        aiResponseText = result.text;
        aiResponseSources = result.sources;
      } else if (lowerCasePrompt.includes("what's the weather") || lowerCasePrompt.includes("set a timer") || lowerCasePrompt.startsWith("how do you spell")) {
        aiResponseText = await generateLowLatencyResponse(prompt);
      } else {
        aiResponseText = await generateTextResponse(prompt);
      }

      if (!aiResponseText && !aiResponseImage) {
        aiResponseText = "I'm sorry, I couldn't process that request.";
      }

      addMessageToActiveProject({ author: MessageAuthor.AI, text: aiResponseText, image: aiResponseImage, sources: aiResponseSources });
      await handleSpeech(aiResponseText);
      
    } catch (error) {
      console.error("Error processing message:", error);
      const errorMessage = "Sorry, something went wrong. Please try again.";
      addMessageToActiveProject({ author: MessageAuthor.AI, text: errorMessage });
      await handleSpeech(errorMessage);
    } finally {
      setIsLoading(false);
      setUploadedImage(null);
    }
  }, [uploadedImage, handleSpeech, activeProjectId]);

  const { isRecording, transcription, start, stop } = useGeminiLive({
    onTurnComplete: (userPrompt) => {
      if (userPrompt) {
        processUserMessage(userPrompt);
      }
    },
    onSpeech: handleSpeech,
  });
  
  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <ProjectSidebar 
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={setActiveProjectId}
        onNewProjectClick={() => setIsModalOpen(true)}
      />
      <main className="flex flex-col flex-1 h-screen">
        <Header projectName={activeProject?.name || 'Loading...'} />
        <ChatInterface 
          history={activeProject?.chatHistory || []} 
          isLoading={isLoading} 
          liveTranscription={transcription}
          isRecording={isRecording}
        />
        <InputBar
          isLoading={isLoading}
          isRecording={isRecording}
          onSendMessage={processUserMessage}
          onToggleRecording={isRecording ? stop : start}
          onFileUpload={setUploadedImage}
          hasUploadedFile={!!uploadedImage}
        />
      </main>
      <CreateProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
};

export default App;
