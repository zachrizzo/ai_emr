'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SettingsPage() {
  const [generalSettings, setGeneralSettings] = useState({
    clinicName: 'My Clinic',
    address: '123 Medical St, Health City, HC 12345',
    phone: '(555) 123-4567',
  })

  const [userProfile, setUserProfile] = useState({
    name: 'Dr. John Doe',
    email: 'john.doe@example.com',
    speciality: 'General Practice',
  })

  const [notificationPreferences, setNotificationPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    billingAlerts: true,
  })

  const handleGeneralSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGeneralSettings({ ...generalSettings, [e.target.name]: e.target.value })
  }

  const handleUserProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserProfile({ ...userProfile, [e.target.name]: e.target.value })
  }

  const handleNotificationPreferenceChange = (name: string, checked: boolean) => {
    setNotificationPreferences({ ...notificationPreferences, [name]: checked })
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="profile">User Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage your clinic's general information</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <Label htmlFor="clinicName">Clinic Name</Label>
                  <Input
                    id="clinicName"
                    name="clinicName"
                    value={generalSettings.clinicName}
                    onChange={handleGeneralSettingsChange}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={generalSettings.address}
                    onChange={handleGeneralSettingsChange}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={generalSettings.phone}
                    onChange={handleGeneralSettingsChange}
                  />
                </div>
                <Button>Save Changes</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>Manage your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={userProfile.name}
                    onChange={handleUserProfileChange}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={userProfile.email}
                    onChange={handleUserProfileChange}
                  />
                </div>
                <div>
                  <Label htmlFor="speciality">Speciality</Label>
                  <Input
                    id="speciality"
                    name="speciality"
                    value={userProfile.speciality}
                    onChange={handleUserProfileChange}
                  />
                </div>
                <Button>Update Profile</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage your notification settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <Switch
                    id="emailNotifications"
                    checked={notificationPreferences.emailNotifications}
                    onCheckedChange={(checked) => handleNotificationPreferenceChange('emailNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="smsNotifications">SMS Notifications</Label>
                  <Switch
                    id="smsNotifications"
                    checked={notificationPreferences.smsNotifications}
                    onCheckedChange={(checked) => handleNotificationPreferenceChange('smsNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="appointmentReminders">Appointment Reminders</Label>
                  <Switch
                    id="appointmentReminders"
                    checked={notificationPreferences.appointmentReminders}
                    onCheckedChange={(checked) => handleNotificationPreferenceChange('appointmentReminders', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="billingAlerts">Billing Alerts</Label>
                  <Switch
                    id="billingAlerts"
                    checked={notificationPreferences.billingAlerts}
                    onCheckedChange={(checked) => handleNotificationPreferenceChange('billingAlerts', checked)}
                  />
                </div>
                <Button>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

