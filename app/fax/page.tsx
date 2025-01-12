'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/utils/supabase-config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { Loader2, Send, Phone } from 'lucide-react'

interface Fax {
    id: string
    direction: 'inbound' | 'outbound'
    status: 'queued' | 'sending' | 'sent' | 'failed' | 'received'
    from_number: string
    to_number: string
    media_url?: string
    pages?: number
    duration?: number
    error_message?: string
    created_at: string
}

export default function FaxPage() {
    const [faxes, setFaxes] = useState<Fax[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const [showSendDialog, setShowSendDialog] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [recipientNumber, setRecipientNumber] = useState('')
    const { user } = useUser()

    useEffect(() => {
        if (user) {
            fetchFaxes()
        }
    }, [user])

    const fetchFaxes = async () => {
        try {
            const { data, error } = await supabase
                .from('faxes')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setFaxes(data)
        } catch (error) {
            console.error('Error fetching faxes:', error)
            toast({
                title: 'Error',
                description: 'Failed to fetch faxes. Please try again.',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleSendFax = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedFile || !recipientNumber || !user) return

        setIsSending(true)
        try {
            // First, upload the file to Supabase Storage
            const fileName = `${crypto.randomUUID()}-${selectedFile.name}`
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('fax-documents')
                .upload(fileName, selectedFile)

            if (uploadError) throw uploadError

            // Get the public URL of the uploaded file
            const { data: { publicUrl } } = supabase.storage
                .from('fax-documents')
                .getPublicUrl(fileName)

            // Send the fax using our Edge Function
            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/fax-operations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'send',
                    to: recipientNumber,
                    mediaUrl: publicUrl,
                    organizationId: user.organization_id,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to send fax')
            }

            toast({
                title: 'Success',
                description: 'Fax queued for sending.',
            })

            setShowSendDialog(false)
            setSelectedFile(null)
            setRecipientNumber('')
            fetchFaxes()
        } catch (error) {
            console.error('Error sending fax:', error)
            toast({
                title: 'Error',
                description: 'Failed to send fax. Please try again.',
                variant: 'destructive',
            })
        } finally {
            setIsSending(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Fax Management</h1>
                <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
                    <DialogTrigger asChild>
                        <Button>
                            <Send className="mr-2 h-4 w-4" />
                            Send Fax
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Send Fax</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSendFax} className="space-y-4">
                            <div>
                                <Label htmlFor="recipient">Recipient Fax Number</Label>
                                <Input
                                    id="recipient"
                                    type="tel"
                                    placeholder="+1234567890"
                                    value={recipientNumber}
                                    onChange={(e) => setRecipientNumber(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="file">Document</Label>
                                <Input
                                    id="file"
                                    type="file"
                                    accept=".pdf,.doc,.docx,.tiff,.tif"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={isSending}>
                                {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSending ? 'Sending...' : 'Send Fax'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Fax History</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Direction</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>From</TableHead>
                                <TableHead>To</TableHead>
                                <TableHead>Pages</TableHead>
                                <TableHead>Duration</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {faxes.map((fax) => (
                                <TableRow key={fax.id}>
                                    <TableCell>{format(new Date(fax.created_at), 'MMM d, yyyy HH:mm')}</TableCell>
                                    <TableCell className="capitalize">{fax.direction}</TableCell>
                                    <TableCell className="capitalize">{fax.status}</TableCell>
                                    <TableCell>{fax.from_number}</TableCell>
                                    <TableCell>{fax.to_number}</TableCell>
                                    <TableCell>{fax.pages || '-'}</TableCell>
                                    <TableCell>{fax.duration ? `${fax.duration}s` : '-'}</TableCell>
                                </TableRow>
                            ))}
                            {faxes.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-4">
                                        No faxes found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
