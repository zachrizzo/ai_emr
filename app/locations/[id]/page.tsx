'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Location } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function LocationDetailsPage({ params }: { params: { id: string } }) {
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) {
          throw error;
        }

        setLocation(data);
      } catch (error) {
        console.error('Error fetching location:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch location data. Please try again.',
          variant: 'destructive',
        });
        router.push('/locations'); // Redirect back to locations list
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocation();
  }, [params.id, router]);

  const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return;

    try {
      const { error } = await supabase
        .from('locations')
        .update({
          name: location.name,
          address: location.address,
          phone_number: location.phone_number,
          email: location.email,
          notes: location.notes,
          status: location.status,
          manager_name: location.manager_name,
          operating_hours: location.operating_hours,
        })
        .eq('id', location.id);

      if (error) throw error;

      toast({
        title: 'Location Updated',
        description: 'The location has been successfully updated.',
      });
      router.push('/locations');
    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        title: 'Update Failed',
        description: 'An error occurred while updating the location.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!location) return <div>Location not found</div>;

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Edit Location</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateLocation} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={location.name}
                onChange={(e) => setLocation({ ...location, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={location.address}
                onChange={(e) => setLocation({ ...location, address: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={location.phone_number}
                onChange={(e) => setLocation({ ...location, phone_number: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={location.email}
                onChange={(e) => setLocation({ ...location, email: e.target.value })}
                required
              />
            </div>
            <div> {/* Status dropdown */}
              <Label htmlFor="status">Status</Label>
              <Select value={location.status} onValueChange={value => setLocation({ ...location, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="manager_name">Manager Name</Label>
              <Input
                id="manager_name"
                value={location.manager_name}
                onChange={(e) => setLocation({ ...location, manager_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="operating_hours">Operating Hours</Label>
              <Textarea
                id="operating_hours"
                value={location.operating_hours}
                onChange={(e) => setLocation({ ...location, operating_hours: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={location.notes}
                onChange={(e) => setLocation({ ...location, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-between">
              <Button type="submit">Update Location</Button>
              <Button type="button" variant="destructive" onClick={() => router.push('/locations')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

