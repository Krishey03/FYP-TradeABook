import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { updateBaseURL } from '@/api/axios';
import { toast } from 'react-hot-toast';

export default function NgrokConfig() {
  const [ngrokUrl, setNgrokUrl] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!ngrokUrl.trim()) {
      toast.error('Please enter a valid ngrok URL');
      return;
    }

    // Ensure URL has proper format
    let formattedUrl = ngrokUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      updateBaseURL(formattedUrl);
      toast.success('Ngrok URL updated successfully!');
      setIsVisible(false);
    } catch (error) {
      toast.error('Failed to update URL');
      console.error('URL update error:', error);
    }
  };

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => setIsVisible(!isVisible)}
        variant="outline"
        size="sm"
        className="bg-white shadow-lg"
      >
        {isVisible ? 'Hide' : 'Config'} Ngrok
      </Button>

      {isVisible && (
        <Card className="mt-2 w-80 shadow-xl">
          <CardHeader>
            <CardTitle className="text-sm">Configure Ngrok URL</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="ngrok-url" className="text-xs">
                  Ngrok URL (e.g., https://abc123.ngrok.io)
                </Label>
                <Input
                  id="ngrok-url"
                  type="text"
                  value={ngrokUrl}
                  onChange={(e) => setNgrokUrl(e.target.value)}
                  placeholder="Enter your ngrok URL..."
                  className="text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1">
                  Update
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    updateBaseURL('http://localhost:5000');
                    toast.success('Reset to localhost');
                    setIsVisible(false);
                  }}
                >
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 