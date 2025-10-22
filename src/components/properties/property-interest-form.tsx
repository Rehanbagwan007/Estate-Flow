'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Heart, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { PropertyInterest } from '@/lib/types';

interface PropertyInterestFormProps {
  propertyId: string;
  propertyTitle: string;
  onSuccess?: (newInterest: PropertyInterest) => void;
}

export function PropertyInterestForm({ propertyId, propertyTitle, onSuccess }: PropertyInterestFormProps) {
  const [isSubmitting, startTransition] = useTransition();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [formData, setFormData] = useState({
    interestLevel: '',
    message: '',
    preferredTime: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const response = await fetch('/api/property-interests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            property_id: propertyId,
            interest_level: formData.interestLevel,
            message: formData.message,
            preferred_meeting_time: selectedDate ? new Date(selectedDate.setHours(parseInt(formData.preferredTime.split(':')[0]), parseInt(formData.preferredTime.split(':')[1]))) : null,
            phone: formData.phone
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          onSuccess?.(data.interest);
        } else {
          throw new Error('Failed to submit interest');
        }
      } catch (error) {
        console.error('Error submitting interest:', error);
        alert('Failed to submit interest. Please try again.');
      }
    });
  };

  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Express Interest in {propertyTitle}
        </CardTitle>
        <CardDescription>
          Let us know about your interest and we'll connect you with our team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="interestLevel">Interest Level</Label>
            <Select 
              value={formData.interestLevel} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, interestLevel: value }))}
              required
            >
              <SelectTrigger id="interestLevel">
                <SelectValue placeholder="Select your interest level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interested">Interested</SelectItem>
                <SelectItem value="very_interested">Very Interested</SelectItem>
                <SelectItem value="ready_to_buy">Ready to Buy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone / WhatsApp Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Tell us more about your requirements..."
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Preferred Meeting Time (Optional)</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Select 
                value={formData.preferredTime} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, preferredTime: value }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="09:00">9:00 AM</SelectItem>
                  <SelectItem value="11:00">11:00 AM</SelectItem>
                  <SelectItem value="14:00">2:00 PM</SelectItem>
                  <SelectItem value="16:00">4:00 PM</SelectItem>
                  <SelectItem value="18:00">6:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.interestLevel || !formData.phone}
              className="flex-1"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Interest
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
