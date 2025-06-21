'use client';

import { useState, useRef, useMemo, type ChangeEvent } from 'react';
import type { Session, Message } from '@/lib/types';
import { documentQA } from '@/ai/flows/document-qa';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Bot, FileText, Loader2, Plus, Send, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('FileReader result is not a string'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function DocuChatPage() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([
    { id: 'session-1', name: 'Session 1', messages: [] },
  ]);
  const [activeTab, setActiveTab] = useState('session-1');
  const [prompt, setPrompt] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeTab),
    [sessions, activeTab]
  );

  const handleNewSession = () => {
    const newSessionNumber = sessions.length + 1;
    const newSession: Session = {
      id: `session-${newSessionNumber}`,
      name: `Session ${newSessionNumber}`,
      messages: [],
    };
    setSessions((prev) => [...prev, newSession]);
    setActiveTab(newSession.id);
    setPdfFile(null);
    setPrompt('');
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else if (file) {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload a PDF file.',
      });
    }
  };

  const handleRemovePdf = () => {
    setPdfFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    if (!pdfFile) {
        toast({
            variant: "destructive",
            title: "PDF Required",
            description: "Please upload a PDF document to ask questions about it.",
        });
        return;
    }

    setIsLoading(true);

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: prompt,
      pdfName: pdfFile.name,
    };

    const updatedSessions = sessions.map((s) =>
      s.id === activeTab ? { ...s, messages: [...s.messages, userMessage] } : s
    );
    setSessions(updatedSessions);
    setPrompt('');

    try {
      const pdfDataUri = await fileToDataUri(pdfFile);
      const result = await documentQA({
        pdfDataUri,
        question: prompt,
      });

      const assistantMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        text: result.answer,
      };

      setSessions((currentSessions) =>
        currentSessions.map((s) =>
          s.id === activeTab ? { ...s, messages: [...s.messages, assistantMessage] } : s
        )
      );
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Failed to get a response from the AI. Please try again.',
      });
       // remove the user message if AI fails
       setSessions(sessions);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
      <header className="border-b bg-card p-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="font-headline text-2xl font-bold text-primary">DocuChat</h1>
          <nav>
            <TabsList>
              {sessions.map((session) => (
                <TabsTrigger key={session.id} value={session.id}>
                  {session.name}
                </TabsTrigger>
              ))}
                <Button variant="ghost" size="icon" onClick={handleNewSession}>
                  <Plus className="h-4 w-4" />
              </Button>
            </TabsList>
          </nav>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        {sessions.map((session) => (
          <TabsContent key={session.id} value={session.id} className="h-full">
            <div className="grid h-full md:grid-cols-3 md:gap-6 lg:gap-8 container mx-auto p-4 md:p-6">
              
              <div className="md:col-span-2 flex flex-col gap-6 h-full">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Document</CardTitle>
                    <CardDescription>Attach a PDF file to your prompt.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pdfFile ? (
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <FileText className="h-6 w-6 text-primary" />
                          <span className="font-medium">{pdfFile.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleRemovePdf}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="application/pdf"
                          className="hidden"
                          id="pdf-upload"
                        />
                        <Label
                          htmlFor="pdf-upload"
                          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 p-8 text-center text-primary transition-colors hover:bg-primary/10"
                        >
                          <FileText className="h-8 w-8" />
                          <span className="mt-2 font-medium">Click to upload PDF</span>
                          <span className="text-xs text-muted-foreground">or drag and drop</span>
                        </Label>
                      </>
                    )}
                  </CardContent>
                </Card>

                <form onSubmit={handleSubmit} className="flex flex-col gap-2 flex-1">
                  <Label htmlFor="prompt-input" className="font-headline text-lg">Your Prompt</Label>
                  <div className="relative flex-1">
                    <Textarea
                      id="prompt-input"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Ask a question about the document..."
                      className="h-full resize-none pr-20"
                      disabled={isLoading}
                    />
                    <Button type="submit" size="icon" className="absolute right-3 top-3" disabled={isLoading || !prompt.trim()}>
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                  </div>
                </form>
              </div>

              <aside className="hidden md:flex flex-col">
                 <h2 className="font-headline text-xl font-semibold mb-4">Session History</h2>
                <Card className="flex-1 overflow-hidden">
                    <CardContent className="p-0 h-full">
                        <ScrollArea className="h-full p-6">
                            {activeSession?.messages.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-muted-foreground">
                                    No messages yet.
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {activeSession?.messages.map((message) => (
                                        <div key={message.id} className={cn("flex items-start gap-4", message.role === "user" ? "justify-start" : "justify-start")}>
                                            <Avatar>
                                                <AvatarImage />
                                                <AvatarFallback className={cn(message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground')}>
                                                    {message.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 rounded-lg border p-4 bg-card w-full">
                                                <div className="font-bold font-headline">
                                                    {message.role === 'user' ? 'Your Prompt' : 'DocuChat'}
                                                </div>
                                                <p className="text-sm mt-1 whitespace-pre-wrap">{message.text}</p>
                                                {message.role === 'user' && message.pdfName && (
                                                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                                                        <FileText className="h-3 w-3" />
                                                        <span>{message.pdfName}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                      <div className="flex items-start gap-4">
                                        <Avatar>
                                          <AvatarImage />
                                          <AvatarFallback className="bg-accent text-accent-foreground"><Bot className="h-5 w-5" /></AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 rounded-lg border p-4 bg-card flex items-center gap-2">
                                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                          <span className="text-sm text-muted-foreground">Thinking...</span>
                                        </div>
                                      </div>
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
              </aside>
            </div>
          </TabsContent>
        ))}
      </main>
    </Tabs>
  );
}
