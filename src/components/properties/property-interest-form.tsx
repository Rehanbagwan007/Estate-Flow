'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Heart, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PropertyInterestFormProps {
  propertyId: string;
  propertyTitle: string;
  onSuccess?: () => void;
}

export function PropertyInterestForm({ propertyId, propertyTitle, onSuccess }: PropertyInterestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [formData, setFormData] = useState({
    interestLevel: '',
    message: '',
    preferredTime: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

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
          preferred_meeting_time: selectedDate ? selectedDate.toISOString() : null,
          phone: formData.phone
        }),
      });

      if (response.ok) {
        onSuccess?.();
        // Reset form
        setFormData({
          interestLevel: '',
          message: '',
          preferredTime: '',
          phone: ''
        });
        setSelectedDate(undefined);
      } else {
        throw new Error('Failed to submit interest');
      }
    } catch (error) {
      console.error('Error submitting interest:', error);
      alert('Failed to submit interest. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Express Interest in {propertyTitle}
        </CardTitle>
        <CardDescription>
          Let us know about your interest and we'll connect you with our team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="interestLevel">Interest Level</Label>
            <Select 
              value={formData.interestLevel} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, interestLevel: value }))}
            >
              <SelectTrigger>
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
            <Label htmlFor="phone">Phone Number</Label>
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
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Preferred Meeting Time</Label>
            <div className="flex gap-4">
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
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">What happens next?</h4>
                <ul className="text-sm text-blue-800 mt-1 space-y-1">
                  <li>• Our team will review your interest</li>
                  <li>• An agent will be assigned to you</li>
                  <li>• You'll receive a WhatsApp notification 30 minutes before your meeting</li>
                  <li>• We'll schedule a property visit at your convenience</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.interestLevel || !formData.phone}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Interest'}
            </Button>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
