'use client'

import { useState } from 'react'
import { useOrganization } from '@/hooks/use-organization'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'

interface Category {
    id: string
    name: string
    description: string | null
}

interface AddBillingCodeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    categories: Category[]
}

export function AddBillingCodeDialog({
    open,
    onOpenChange,
    categories,
}: AddBillingCodeDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        longDescription: '',
        categoryId: '',
        defaultPrice: '',
        effectiveDate: new Date().toISOString().split('T')[0],
    })

    const { organization } = useOrganization()
    const supabase = createClientComponentClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!organization?.id) return

        setIsSubmitting(true)
        try {
            const { error } = await supabase.from('cpt_codes').insert({
                organization_id: organization.id,
                code: formData.code,
                description: formData.description,
                long_description: formData.longDescription || null,
                category_id: formData.categoryId || null,
                default_price: formData.defaultPrice ? parseFloat(formData.defaultPrice) : null,
                effective_date: formData.effectiveDate,
                status: 'active',
            })

            if (error) throw error

            toast({
                title: 'Success',
                description: 'Billing code added successfully',
            })

            onOpenChange(false)
            setFormData({
                code: '',
                description: '',
                longDescription: '',
                categoryId: '',
                defaultPrice: '',
                effectiveDate: new Date().toISOString().split('T')[0],
            })
        } catch (error) {
            console.error('Error adding billing code:', error)
            toast({
                title: 'Error',
                description: 'Failed to add billing code. Please try again.',
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Billing Code</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="code">CPT Code</Label>
                            <Input
                                id="code"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="longDescription">Long Description</Label>
                            <Textarea
                                id="longDescription"
                                value={formData.longDescription}
                                onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={formData.categoryId}
                                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="defaultPrice">Default Price</Label>
                            <Input
                                id="defaultPrice"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.defaultPrice}
                                onChange={(e) => setFormData({ ...formData, defaultPrice: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="effectiveDate">Effective Date</Label>
                            <Input
                                id="effectiveDate"
                                type="date"
                                value={formData.effectiveDate}
                                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Adding...' : 'Add Code'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
