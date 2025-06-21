'use client';

import { useState, useRef, useMemo, type ChangeEvent } from 'react';
import type { Session, Message } from '@/lib/types';
import { documentQA } from '@/ai/flows/document-qa';
import { chat } from '@/ai/flows/chat';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bot,
  FileText,
  Loader2,
  Plus,
  Send,
  X,
  Calendar,
  CalendarDays,
  CalendarClock,
  CalendarRange,
  Paperclip,
  Book,
  Landmark,
  Users,
  Scale,
  DollarSign,
  Globe,
  Map,
  MapPin,
  User,
  Settings,
  HelpCircle,
} from 'lucide-react';

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

    setIsLoading(true);

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: prompt,
      pdfName: pdfFile?.name,
    };

    const updatedSessions = sessions.map((s) =>
      s.id === activeTab ? { ...s, messages: [...s.messages, userMessage] } : s
    );
    setSessions(updatedSessions);
    setPrompt('');

    try {
      let resultText: string;

      if (pdfFile) {
        const pdfDataUri = await fileToDataUri(pdfFile);
        const result = await documentQA({
          pdfDataUri,
          question: prompt,
        });
        resultText = result.answer;
      } else {
        const result = await chat({ prompt });
        resultText = result.response;
      }

      const assistantMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        text: resultText,
      };

      setSessions((currentSessions) =>
        currentSessions.map((s) =>
          s.id === activeTab ? { ...s, messages: [...s.messages, assistantMessage] } : s
        )
      );
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: errorMessage,
      });
       setSessions(sessions.map(s => s.id === activeTab ? {...s, messages: s.messages.filter(m => m.id !== userMessage.id)} : s));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="w-64 flex-shrink-0 flex flex-col border-r bg-card hidden md:flex">
        <div className="p-4 border-b h-[61px] flex items-center">
          <h1 className="font-headline text-2xl font-bold text-primary">Mitigate.AI</h1>
        </div>
        <nav className="p-4 space-y-2 flex-1">
            <Button variant="ghost" className="w-full justify-start text-base font-normal">
              <Bot className="mr-3 h-5 w-5" /> Chatbot
            </Button>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="time-period" className="border-b-0">
                <AccordionTrigger className="flex items-center p-2 text-base font-normal hover:no-underline rounded-md hover:bg-accent hover:text-accent-foreground w-full justify-between">
                  <span className="flex items-center">
                    <Calendar className="mr-3 h-5 w-5" /> Time Period
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-7 pt-2 space-y-1">
                    <Button variant="ghost" className="w-full justify-start text-base font-normal">
                      <CalendarDays className="mr-3 h-5 w-5" /> Daily
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-base font-normal">
                      <Book className="mr-3 h-5 w-5" /> Weekly
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-base font-normal">
                      <CalendarClock className="mr-3 h-5 w-5" /> Monthly
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-base font-normal">
                      <CalendarRange className="mr-3 h-5 w-5" /> Quarterly
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="events" className="border-b-0">
                <AccordionTrigger className="flex items-center p-2 text-base font-normal hover:no-underline rounded-md hover:bg-accent hover:text-accent-foreground w-full justify-between">
                  <span className="flex items-center">
                    <Landmark className="mr-3 h-5 w-5" /> Events
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-7 pt-2 space-y-1">
                    <Button variant="ghost" className="w-full justify-start text-base font-normal">
                      <Users className="mr-3 h-5 w-5" /> Social
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-base font-normal">
                      <Scale className="mr-3 h-5 w-5" /> Legal
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-base font-normal">
                      <DollarSign className="mr-3 h-5 w-5" /> Economical
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-base font-normal">
                      <Globe className="mr-3 h-5 w-5" /> Geopolitical
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="region" className="border-b-0">
                <AccordionTrigger className="flex items-center p-2 text-base font-normal hover:no-underline rounded-md hover:bg-accent hover:text-accent-foreground w-full justify-between">
                  <span className="flex items-center">
                    <Map className="mr-3 h-5 w-5" /> Region
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-7 pt-2 space-y-1">
                    <Button variant="ghost" className="w-full justify-start text-base font-normal">
                      <MapPin className="mr-3 h-5 w-5" /> Europe
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-base font-normal">
                      <MapPin className="mr-3 h-5 w-5" /> Asia
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-base font-normal">
                      <MapPin className="mr-3 h-5 w-5" /> Africa
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-base font-normal">
                      <MapPin className="mr-3 h-5 w-5" /> Americas
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-base font-normal">
                      <MapPin className="mr-3 h-5 w-5" /> Australasia
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </nav>
        <div className="p-2 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start items-center gap-3 p-2 h-auto">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left">
                    <p className="text-sm font-medium leading-none">User Name</p>
                    <p className="text-xs leading-none text-muted-foreground">user@email.com</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" side="top" align="start">
                <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Help/User Guide</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <header className="border-b bg-card p-2 flex-shrink-0">
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
          </header>

          <main className="flex-1 overflow-hidden">
            {sessions.map((session) => (
              <TabsContent key={session.id} value={session.id} className="h-full m-0">
                <div className="flex h-full">
                  <div className="flex-1 p-6 overflow-y-auto">
                    <ScrollArea className="h-full pr-4">
                      <div className="space-y-6">
                        {activeSession?.messages.filter((m) => m.role === 'assistant').length === 0 && !isLoading && (
                           <div className="flex h-full items-center justify-center text-muted-foreground">
                                <div className="text-center p-10">
                                    <Bot size={48} className="mx-auto text-primary" />
                                    <p className="mt-4 text-lg font-headline">AI responses will appear here</p>
                                    <p className="text-sm">Ask a question to get started, or upload a document to ask questions about it.</p>
                                </div>
                            </div>
                        )}
                        {activeSession?.messages
                          .filter((m) => m.role === 'assistant')
                          .map((message) => (
                          <div key={message.id} className="flex items-start gap-4">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className='bg-accent text-accent-foreground'>
                                <Bot className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <Card className="flex-1 rounded-xl shadow-sm">
                              <CardContent className="p-4">
                                <p className="whitespace-pre-wrap">{message.text}</p>
                              </CardContent>
                            </Card>
                          </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-start gap-4">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-accent text-accent-foreground"><Bot className="h-4 w-4" /></AvatarFallback>
                                </Avatar>
                                <div className="flex-1 rounded-lg border p-4 bg-card flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Thinking...</span>
                                </div>
                            </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  <aside className="w-96 border-l flex-shrink-0 flex flex-col bg-card">
                    <div className="p-4 border-b">
                      <h2 className="font-headline text-lg font-semibold">{activeSession?.name}</h2>
                    </div>
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {activeSession?.messages.filter((m) => m.role === 'user').length === 0 ? (
                            <div className="text-center text-muted-foreground pt-10 px-4">
                                Your previous prompts in this session will appear here.
                            </div>
                        ) : activeSession?.messages
                            .filter((m) => m.role === 'user')
                            .map((message) => (
                           <Card key={message.id} className="bg-background shadow-sm">
                            <CardContent className="p-3">
                               <p className="font-medium text-sm">{message.text}</p>
                               {message.pdfName && (
                                   <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                                       <FileText className="h-3 w-3" />
                                       <span>{message.pdfName}</span>
                                   </div>
                               )}
                               </CardContent>
                           </Card>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="p-4 border-t mt-auto bg-card flex-shrink-0">
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="application/pdf"
                                className="hidden"
                                id="pdf-upload"
                                />
                                {pdfFile ? (
                                    <div className="flex items-center justify-between rounded-md border p-2 bg-background text-sm">
                                        <div className="flex items-center gap-2 truncate">
                                        <FileText className="h-4 w-4 text-primary shrink-0" />
                                        <span className="font-medium truncate">{pdfFile.name}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={handleRemovePdf} className="h-6 w-6 shrink-0">
                                        <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                                        <Paperclip className="mr-2 h-4 w-4" />
                                        Upload PDF
                                    </Button>
                                )}
                            </div>
                             <div className="relative">
                                <Textarea
                                id="prompt-input"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Text input"
                                className="resize-none pr-12"
                                rows={3}
                                disabled={isLoading}
                                />
                                <Button type="submit" size="icon" className="absolute right-2 bottom-2 h-8 w-8" disabled={isLoading || !prompt.trim()}>
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                            </div>
                        </form>
                    </div>
                  </aside>
                </div>
              </TabsContent>
            ))}
          </main>
        </Tabs>
      </div>
    </div>
  );
}
