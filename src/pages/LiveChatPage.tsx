import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '@/contexts/ChatContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  MessageSquare,
  Plus,
  Send,
  Paperclip,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Users,
  Phone
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import ChatWindow from '@/components/chat/ChatWindow';

const LiveChatPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    rooms,
    currentRoom,
    messages,
    loading,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    closeRoom,
    sendMessage,
    sendFile,
    connectionStatus,
    isConnected
  } = useChat();

  const [showNewChatForm, setShowNewChatForm] = useState(false);
  const [newChatSubject, setNewChatSubject] = useState('');
  const [newChatCategory, setNewChatCategory] = useState('');
  const [newChatPriority, setNewChatPriority] = useState('medium');
  const [messageText, setMessageText] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const categories = [
    { value: 'trading', label: 'Trading Issues' },
    { value: 'wallet', label: 'Wallet Support' },
    { value: 'kyc', label: 'KYC Verification' },
    { value: 'security', label: 'Security Concerns' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'general', label: 'General Inquiry' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-green-500' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
    { value: 'high', label: 'High', color: 'bg-orange-500' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-500' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="text-yellow-500" size={16} />;
      case 'in_progress':
        return <Users className="text-blue-500" size={16} />;
      case 'closed':
        return <CheckCircle className="text-green-500" size={16} />;
      default:
        return <AlertCircle className="text-gray-500" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'closed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const handleCreateRoom = async () => {
    if (!newChatSubject.trim()) {
      toast({
        title: "Error",
        description: "Please enter a subject for your chat",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingRoom(true);
    try {
      const room = await createRoom(newChatSubject, newChatCategory, newChatPriority);
      if (room) {
        setShowNewChatForm(false);
        setNewChatSubject('');
        setNewChatCategory('');
        setNewChatPriority('medium');
        await joinRoom(room.id);
        toast({
          title: "Success",
          description: "Chat session created successfully",
        });
      }
    } catch (err) {
      console.error('Error creating room:', err);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    setIsSendingMessage(true);
    try {
      await sendMessage(messageText);
      setMessageText('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendFile(file);
    } catch (err) {
      console.error('Error uploading file:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="container mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 min-h-[44px] min-w-[44px]"
          onClick={() => navigate('/settings')}
          aria-label="Back to Settings"
        >
          <ArrowLeft className="text-white" size={26} />
        </Button>
        <h1 className="text-2xl font-bold text-white">Live Chat Support</h1>
      </div>

      {/* Connection Status */}
      <div className="mb-4">
        <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
          isConnected
            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
            : 'bg-red-500/20 text-red-300 border border-red-500/30'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          {isConnected ? 'Connected' : `Disconnected (${connectionStatus})`}
        </div>
      </div>

      {!currentRoom ? (
        <div className="space-y-6">
          {/* New Chat Button */}
          <Card className="bg-dex-dark/80 border-dex-secondary/30 shadow-lg shadow-dex-secondary/10">
            <CardContent className="p-6">
              <Button
                onClick={() => setShowNewChatForm(true)}
                className="w-full min-h-[44px] bg-dex-primary hover:bg-dex-primary/90 text-white"
                disabled={loading}
              >
                <Plus className="mr-2" size={20} />
                Start New Chat Session
              </Button>
            </CardContent>
          </Card>

          {/* New Chat Form */}
          {showNewChatForm && (
            <Card className="bg-dex-dark/80 border-dex-secondary/30 shadow-lg shadow-dex-secondary/10">
              <CardHeader>
                <CardTitle className="text-white">New Chat Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-white text-sm mb-2 block">Subject *</label>
                  <Input
                    value={newChatSubject}
                    onChange={(e) => setNewChatSubject(e.target.value)}
                    placeholder="Briefly describe your issue"
                    className="bg-dex-secondary border-dex-secondary/30 text-white min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-white text-sm mb-2 block">Category</label>
                  <Select value={newChatCategory} onValueChange={setNewChatCategory}>
                    <SelectTrigger className="bg-dex-secondary border-dex-secondary/30 text-white min-h-[44px]">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-white text-sm mb-2 block">Priority</label>
                  <Select value={newChatPriority} onValueChange={setNewChatPriority}>
                    <SelectTrigger className="bg-dex-secondary border-dex-secondary/30 text-white min-h-[44px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${priority.color}`} />
                            {priority.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleCreateRoom}
                    disabled={isCreatingRoom || !newChatSubject.trim()}
                    className="flex-1 min-h-[44px] bg-dex-primary hover:bg-dex-primary/90 text-white"
                  >
                    {isCreatingRoom ? (
                      <Loader2 className="mr-2 animate-spin" size={20} />
                    ) : (
                      <MessageSquare className="mr-2" size={20} />
                    )}
                    Create Chat
                  </Button>
                  <Button
                    onClick={() => setShowNewChatForm(false)}
                    variant="outline"
                    className="min-h-[44px] border-dex-secondary/30 text-white hover:bg-dex-secondary/20"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chat History */}
          <Card className="bg-dex-dark/80 border-dex-secondary/30 shadow-lg shadow-dex-secondary/10">
            <CardHeader>
              <CardTitle className="text-white">Your Chat Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-dex-primary" size={32} />
                </div>
              ) : rooms.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto mb-4 text-dex-text-secondary" size={48} />
                  <p className="text-dex-text-secondary">No chat sessions yet</p>
                  <p className="text-dex-text-secondary text-sm">Start a new chat to get help from our support team</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      onClick={() => joinRoom(room.id)}
                      className="p-4 rounded-lg border border-dex-secondary/30 hover:bg-dex-secondary/10 cursor-pointer transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-white font-medium truncate flex-1 mr-2">
                          {room.subject || 'Untitled Chat'}
                        </h4>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(room.status)}
                          <Badge className={`text-xs ${getStatusColor(room.status)}`}>
                            {room.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-dex-text-secondary">
                        <span>{room.category && categories.find(c => c.value === room.category)?.label}</span>
                        <span>{formatDistanceToNow(new Date(room.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        // Chat Room View
        <ChatWindow onBack={leaveRoom} />
      )}
    </div>
  );
};

export default LiveChatPage;
