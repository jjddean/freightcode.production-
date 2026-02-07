import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import MediaCardHeader from '@/components/ui/media-card-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User, Users, Key,
  Mail, Globe, Clock,
  Edit, Smartphone
} from 'lucide-react';

const AccountPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const liveUser = useQuery(api.users.current);

  // Mock user data fallback
  const HARDCODED_USER = {
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    company: 'Global Shipping Inc.',
    role: 'Logistics Manager',
    phone: '+1 (555) 123-4567',
    joinDate: 'March 15, 2022',
    lastLogin: 'November 5, 2023, 9:45 AM',
    timezone: 'Eastern Time (ET)',
    language: 'English',
    twoFactorEnabled: true
  };

  const userData = liveUser ? {
    ...HARDCODED_USER,
    name: liveUser.name || HARDCODED_USER.name,
    email: liveUser.email || HARDCODED_USER.email,
  } : HARDCODED_USER;

  const initials = userData.name.split(' ').map((n: string) => n[0]).join('');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-4 space-y-8">
        <MediaCardHeader
          title="Account Settings"
          subtitle="Profile & Preferences"
          description="Manage your personal information, security settings, and team access."
          backgroundImage="https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
          overlayOpacity={0.6}
        />

        {/* Matching Reports Page Tab Style */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['Profile', 'Security', 'Notifications', 'Team'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.toLowerCase()
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (<div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Card */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>My Profile</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarFallback className="text-xl bg-blue-100 text-blue-600">{initials}</AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold text-gray-900">{userData.name}</h2>
                <p className="text-sm text-gray-500 mb-1">{userData.role}</p>
                <p className="text-sm text-gray-500 mb-4">{userData.company}</p>
                <Button className="w-full" variant="outline">
                  <Edit className="h-4 w-4 mr-2" /> Edit Profile
                </Button>
                <div className="mt-6 w-full text-left space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-3 text-gray-400" />
                    <span>Joined {userData.joinDate}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Globe className="h-4 w-4 mr-3 text-gray-400" />
                    <span>{userData.timezone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Update your contact details and preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input defaultValue={userData.name} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input defaultValue={userData.email} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input defaultValue={userData.phone} />
                  </div>
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input defaultValue={userData.company} />
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select defaultValue="English (US)">
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="English (US)">English (US)</SelectItem>
                          <SelectItem value="Spanish">Spanish</SelectItem>
                          <SelectItem value="French">French</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Time Zone</Label>
                      <Select defaultValue={userData.timezone}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={userData.timezone}>{userData.timezone}</SelectItem>
                          <SelectItem value="Pacific Time (PT)">Pacific Time (PT)</SelectItem>
                          <SelectItem value="Central Time (CT)">Central Time (CT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="ghost">Cancel</Button>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </div>
        </div>)}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (<div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your password and authentication methods.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-gray-900">Password</h4>
                  <p className="text-sm text-gray-500">Last changed 45 days ago</p>
                </div>
                <Button variant="outline">Change Password</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                </div>
                <Button variant={userData.twoFactorEnabled ? "outline" : "default"}>
                  {userData.twoFactorEnabled ? "Manage 2FA" : "Enable 2FA"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Access</CardTitle>
              <CardDescription>Manage API keys for system integration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <Key className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-sm text-gray-900">Production Key</p>
                    <p className="text-xs text-gray-500">Created Oct 10, 2023</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">View</Button>
                  <Button variant="outline" size="sm">Regenerate</Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <Key className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-sm text-gray-900">Test Key</p>
                    <p className="text-xs text-gray-500">Created Oct 10, 2023</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">View</Button>
                  <Button variant="outline" size="sm">Regenerate</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>)}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (<div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to receive updates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { title: "Shipment Updates", desc: "Status changes and delivery alerts" },
                { title: "Document Alerts", desc: "Required actions and pending sign-offs" },
                { title: "Payment Reminders", desc: "Upcoming due dates and successful payments" },
                { title: "Marketing", desc: "News, updates, and promotional offers" }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <Switch defaultChecked={i !== 3} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-gray-400" />
                      <Switch defaultChecked={i < 2} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button>Save Preferences</Button>
            </CardFooter>
          </Card>
        </div>)}

        {/* TEAM TAB */}
        {activeTab === 'team' && (<div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage access and roles for your organization.</CardDescription>
              </div>
              <Button size="sm"><Users className="h-4 w-4 mr-2" /> Invite Member</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-4">
                {[
                  { name: 'Alex Johnson', email: 'alex.johnson@example.com', role: 'Admin', status: 'Active' },
                  { name: 'Sarah Williams', email: 'sarah.w@example.com', role: 'User', status: 'Active' },
                  { name: 'Michael Chen', email: 'michael.c@example.com', role: 'Viewer', status: 'Invited' },
                ].map((member, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>{member.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={member.role === 'Admin' ? 'default' : 'secondary'}>{member.role}</Badge>
                      <Badge variant="outline" className={member.status === 'Active' ? 'text-green-600 border-green-200 bg-green-50' : 'text-amber-600 border-amber-200 bg-amber-50'}>
                        {member.status}
                      </Badge>
                      <Button variant="ghost" size="sm">Manage</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>)}


      </div>
    </div>
  );
};

export default AccountPage;