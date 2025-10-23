'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  Play, 
  Pause,
  Clock,
  User,
  Calendar
} from 'lucide-react';
import type { CallLog } from '@/lib/types';


interface ExotelCallInterfaceProps {
  agentId: string;
  customerId?: string;
  customerPhone?: string;
  onCallStart?: (callId: string) => void;
  onCallEnd?: (callId: string, duration: number) => void;
}

export function ExotelCallInterface({ 
  agentId, 
  customerId, 
  customerPhone, 
  onCallStart, 
  onCallEnd 
}: ExotelCallInterfaceProps) {
  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'connected' | 'ended'>('idle');
  const [phoneNumber, setPhoneNumber] = useState(customerPhone || '');
  const [customerName, setCustomerName] = useState('');
  const [callNotes, setCallNotes] = useState('');
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [recentCalls, setRecentCalls] = useState<CallLog[]>([]);

  // Simulate call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  // Format duration in MM:SS
  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = async () => {
    if (!phoneNumber.trim()) {
      alert('Please enter a phone number');
      return;
    }

    setIsCalling(true);
    setCallStatus('ringing');
    setCallDuration(0);

    try {
      // Simulate Exotel API call
      const response = await fetch('/api/calls/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: agentId,
          customer_phone: phoneNumber,
          customer_id: customerId,
          call_type: 'outbound'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setCurrentCallId(data.call_id);
        onCallStart?.(data.call_id);
        
        // Simulate call connection after 3 seconds
        setTimeout(() => {
          setCallStatus('connected');
        }, 3000);
      } else {
        throw new Error(data.error || 'Failed to initiate call');
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      alert('Failed to start call. Please try again.');
      setCallStatus('idle');
    } finally {
      setIsCalling(false);
    }
  };

  const handleEndCall = async () => {
    if (!currentCallId) return;

    try {
      const response = await fetch('/api/calls/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          call_id: currentCallId,
          duration: callDuration,
          notes: callNotes
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        onCallEnd?.(currentCallId, callDuration);
        setCallStatus('ended');
        setCurrentCallId(null);
        setCallNotes('');
        
        // Refresh recent calls
        fetchRecentCalls();
      }
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const fetchRecentCalls = async () => {
    try {
      const response = await fetch('/api/calls/recent');
      const data = await response.json();
      if (data.success) {
        setRecentCalls(data.calls);
      }
    } catch (error) {
      console.error('Error fetching recent calls:', error);
    }
  };

  useEffect(() => {
    fetchRecentCalls();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'busy':
      case 'no_answer':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Call Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Make a Call
          </CardTitle>
          <CardDescription>
            Initiate outbound calls to customers using Exotel integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter customer phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isCalling || callStatus !== 'idle'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name (Optional)</Label>
              <Input
                id="customerName"
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={isCalling || callStatus !== 'idle'}
              />
            </div>
          </div>

          {/* Call Status Display */}
          {callStatus !== 'idle' && (
            <div className="bg-gray-50 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {callStatus === 'ringing' ? 'Calling...' : 
                     callStatus === 'connected' ? 'Connected' : 
                     callStatus === 'ended' ? 'Call Ended' : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {phoneNumber} {customerName && `- ${customerName}`}
                  </p>
                </div>
                {callStatus === 'connected' && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-mono text-lg">{formatDuration(callDuration)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Call Controls */}
          <div className="flex gap-3">
            {callStatus === 'idle' && (
              <Button 
                onClick={handleStartCall}
                disabled={!phoneNumber.trim() || isCalling}
                className="flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                {isCalling ? 'Starting Call...' : 'Start Call'}
              </Button>
            )}
            
            {callStatus === 'connected' && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => setIsMuted(!isMuted)}
                  className="flex items-center gap-2"
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {isMuted ? 'Unmute' : 'Mute'}
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleEndCall}
                  className="flex items-center gap-2"
                >
                  <PhoneOff className="h-4 w-4" />
                  End Call
                </Button>
              </>
            )}
          </div>

          {/* Call Notes */}
          {callStatus === 'connected' && (
            <div className="space-y-2">
              <Label htmlFor="callNotes">Call Notes</Label>
              <Textarea
                id="callNotes"
                placeholder="Add notes about the call..."
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Calls */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Calls</CardTitle>
          <CardDescription>
            Your recent call history and recordings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentCalls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No calls made yet
            </div>
          ) : (
            <div className="space-y-4">
              {recentCalls.slice(0, 5).map((call) => (
                <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        Call to {call.customer_id}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(call.created_at).toLocaleString()}
                      </p>
                      {call.duration_seconds && (
                        <p className="text-sm text-muted-foreground">
                          Duration: {formatDuration(call.duration_seconds)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={getStatusColor(call.call_status)}>
                      {call.call_status}
                    </Badge>
                    {call.recording_url && (
                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline">
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Volume2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
