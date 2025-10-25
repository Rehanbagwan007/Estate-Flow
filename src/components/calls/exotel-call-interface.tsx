
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
  Clock,
  Loader2,
  X
} from 'lucide-react';
import type { CallLog } from '@/lib/types';


interface ExotelCallInterfaceProps {
  agentId: string;
  callTarget: {
    customerId: string;
    customerPhone: string;
    customerName: string;
  } | null;
  onCallEnd?: () => void;
}

export function ExotelCallInterface({ 
  agentId, 
  callTarget,
  onCallEnd 
}: ExotelCallInterfaceProps) {
  const [isCalling, setIsCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'connected' | 'ended'>('idle');
  const [callNotes, setCallNotes] = useState('');
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [recentCalls, setRecentCalls] = useState<CallLog[]>([]);

  // Effect to handle new call targets
  useEffect(() => {
    if (callTarget && callStatus === 'idle') {
      handleStartCall(callTarget.customerPhone, callTarget.customerId);
    } else if (!callTarget) {
        resetCallState();
    }
  }, [callTarget]);

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

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = async (phoneNumber: string, customerId: string) => {
    if (!phoneNumber.trim()) {
      alert('Phone number is missing.');
      return;
    }

    setIsCalling(true);
    setCallStatus('ringing');
    setCallDuration(0);
    setCallNotes('');

    try {
      const response = await fetch('/api/calls/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      resetCallState();
    } finally {
      setIsCalling(false);
    }
  };

  const handleEndCall = async (endedByUser: boolean = true) => {
    if (!currentCallId) return;

    if (endedByUser) {
        try {
        const response = await fetch('/api/calls/end', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            call_id: currentCallId,
            duration: callDuration,
            notes: callNotes
            }),
        });

        if (response.ok) {
            fetchRecentCalls();
        }
        } catch (error) {
        console.error('Error ending call:', error);
        }
    }
    
    resetCallState();
  };
  
  const resetCallState = () => {
    setIsCalling(false);
    setCallStatus('idle');
    setCurrentCallId(null);
    setCallDuration(0);
    setCallNotes('');
    onCallEnd?.();
  };

  const fetchRecentCalls = async () => {
    try {
      const response = await fetch('/api/calls/recent');
      const data = await response.json();
      if (data.success) {
        setRecentCalls(data.calls);
      } else {
        console.error("Error fetching recent calls:", data.error);
      }
    } catch (error) {
      console.error('Error fetching recent calls:', error);
    }
  };

  useEffect(() => {
    fetchRecentCalls();
  }, []);

  if (callStatus === 'idle') {
    return null; // Don't show the call interface if there's no active call
  }

  return (
    <Card className="bg-secondary fixed bottom-4 right-4 w-80 z-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                {isCalling || callStatus === 'ringing' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Phone className="h-5 w-5" />}
                {isCalling ? 'Starting...' : callStatus === 'ringing' ? 'Ringing...' : 'On Call'}
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleEndCall()}>
                <X className="h-4 w-4" />
            </Button>
        </CardTitle>
        <CardDescription>
          {callTarget ? `Calling ${callTarget.customerName}` : 'Outbound call in progress'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Call Status Display */}
        <div className="bg-background/50 border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-lg">
                {callStatus === 'connected' ? 'Connected' : callStatus.charAt(0).toUpperCase() + callStatus.slice(1)}
              </p>
              <p className="text-sm text-muted-foreground">
                {callTarget?.customerName}
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

        {/* Call Controls */}
        <div className="flex gap-3 justify-end">
          {callStatus === 'connected' && (
            <Button 
              variant="destructive"
              onClick={() => handleEndCall()}
              className="flex items-center gap-2"
            >
              <PhoneOff className="h-4 w-4" />
              End Call
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
