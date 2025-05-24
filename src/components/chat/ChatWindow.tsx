import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Send, 
  Paperclip, 
  X, 
  Download, 
  Image as ImageIcon,
  File,
  Loader2,
  MoreVertical,
  Phone,
  Video
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface ChatWindowProps {
  onBack: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    currentRoom,
    messages,
    sendMessage,
    sendFile,
    closeRoom,
    loading
  } = useChat();

  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

    setIsUploadingFile(true);
    try {
      await sendFile(file);
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    } catch (err) {
      console.error('Error uploading file:', err);
    } finally {
      setIsUploadingFile(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCloseRoom = async () => {
    if (!currentRoom) return;
    
    try {
      await closeRoom(currentRoom.id);
      onBack();
    } catch (err) {
      console.error('Error closing room:', err);
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

  const renderMessage = (message: any) => {
    const isOwnMessage = message.sender_id === user?.id;
    const isSystemMessage = message.message_type === 'system';

    if (isSystemMessage) {
      return (
        <div key={message.id} className="flex justify-center my-4">
          <div className="bg-dex-secondary/20 text-dex-text-secondary text-xs px-3 py-1 rounded-full">
            {message.message_text}
          </div>
        </div>
      );
    }

    return (
      <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[80%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
          <div
            className={`p-3 rounded-lg ${
              isOwnMessage
                ? 'bg-dex-primary text-white'
                : 'bg-dex-secondary/30 text-white border border-dex-secondary/30'
            }`}
          >
            {/* Message content */}
            {message.message_type === 'text' && (
              <p className="text-sm leading-relaxed">{message.message_text}</p>
            )}

            {message.message_type === 'image' && (
              <div className="space-y-2">
                {message.message_text && (
                  <p className="text-sm">{message.message_text}</p>
                )}
                {message.attachment_url && (
                  <div className="relative">
                    <img
                      src={message.attachment_url}
                      alt={message.attachment_name || 'Image'}
                      className="max-w-full h-auto rounded-lg"
                      style={{ maxHeight: '200px' }}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2 h-8 w-8 p-0"
                      onClick={() => window.open(message.attachment_url, '_blank')}
                    >
                      <Download size={14} />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {message.message_type === 'file' && (
              <div className="space-y-2">
                {message.message_text && (
                  <p className="text-sm">{message.message_text}</p>
                )}
                {message.attachment_url && (
                  <div className="flex items-center gap-2 p-2 bg-black/20 rounded-lg">
                    <File size={16} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {message.attachment_name || 'File'}
                      </p>
                      {message.attachment_size && (
                        <p className="text-xs opacity-70">
                          {(message.attachment_size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0"
                      onClick={() => window.open(message.attachment_url, '_blank')}
                    >
                      <Download size={14} />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Message timestamp */}
          <div className={`text-xs text-dex-text-secondary mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
            {format(new Date(message.created_at), 'HH:mm')}
          </div>
        </div>
      </div>
    );
  };

  if (!currentRoom) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <Card className="bg-dex-dark/80 border-dex-secondary/30 mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px]"
                onClick={onBack}
              >
                <ArrowLeft className="text-white" size={20} />
              </Button>
              <div className="flex-1">
                <CardTitle className="text-white text-lg">
                  {currentRoom.subject || 'Chat Support'}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`text-xs ${getStatusColor(currentRoom.status)}`}>
                    {currentRoom.status.replace('_', ' ')}
                  </Badge>
                  {currentRoom.category && (
                    <span className="text-dex-text-secondary text-xs">
                      • {currentRoom.category}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]">
                  <MoreVertical className="text-white" size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCloseRoom}>
                  <X className="mr-2" size={16} />
                  Close Chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
      </Card>

      {/* Messages Area */}
      <Card className="flex-1 bg-dex-dark/80 border-dex-secondary/30 mb-4">
        <CardContent className="p-4 h-full flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-2 mb-4" style={{ maxHeight: '400px' }}>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-dex-primary" size={32} />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-dex-text-secondary">No messages yet</p>
                <p className="text-dex-text-secondary text-sm">Start the conversation!</p>
              </div>
            ) : (
              messages.map(renderMessage)
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="bg-dex-secondary border-dex-secondary/30 text-white min-h-[44px] resize-none"
                disabled={currentRoom.status === 'closed'}
              />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />

            <Button
              variant="outline"
              size="icon"
              className="min-h-[44px] min-w-[44px] border-dex-secondary/30 hover:bg-dex-secondary/20"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingFile || currentRoom.status === 'closed'}
            >
              {isUploadingFile ? (
                <Loader2 className="animate-spin text-white" size={20} />
              ) : (
                <Paperclip className="text-white" size={20} />
              )}
            </Button>

            <Button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || isSendingMessage || currentRoom.status === 'closed'}
              className="min-h-[44px] min-w-[44px] bg-dex-primary hover:bg-dex-primary/90 text-white"
            >
              {isSendingMessage ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Send size={20} />
              )}
            </Button>
          </div>

          {currentRoom.status === 'closed' && (
            <div className="mt-2 text-center">
              <p className="text-dex-text-secondary text-sm">This chat session has been closed</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatWindow;
