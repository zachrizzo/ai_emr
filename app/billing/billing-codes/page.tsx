'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { PlusCircle, Search } from 'lucide-react'
import { AddBillingCodeDialog } from './add-billing-code-dialog'

interface BillingCode {
    id: string
    code: string
    description: string
    long_description: string | null
    category_id: string
    default_price: number | null
    status: string
    effective_date: string
    end_date: string | null
}

interface Category {
    id: string
    name: string
    description: string | null
}

export default function BillingCodesPage() {
    const [codes, setCodes] = useState<BillingCode[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('')
    const [selectedStatus, setSelectedStatus] = useState<string>('active')
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const { user } = useUser()
    const supabase = createClientComponentClient()

    useEffect(() => {
        if (!user?.organization_id) return

        const fetchData = async () => {
            // Fetch categories
            const { data: categoriesData } = await supabase
                .from('cpt_categories')
                .select('*')
                .eq('organization_id', user.organization_id)
                .order('name')

            if (categoriesData) {
                setCategories(categoriesData)
            }

            // Fetch billing codes
            const query = supabase
                .from('cpt_codes')
                .select('*')
                .eq('organization_id', user.organization_id)
                .eq('status', selectedStatus)

            if (selectedCategory) {
                query.eq('category_id', selectedCategory)
            }

            if (searchQuery) {
                query.or(`code.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
            }

            const { data } = await query.order('code')

            if (data) {
                setCodes(data)
            }
        }

        fetchData()

        // Set up real-time subscription
        const channel = supabase
            .channel('billing-codes-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'cpt_codes',
                    filter: `organization_id=eq.${user.organization_id}`
                },
                () => fetchData()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user?.organization_id, searchQuery, selectedCategory, selectedStatus])

    return (
        <div className="container mx-auto py-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Billing Codes</h1>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add Code
                </Button>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search codes or descriptions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Categories</SelectItem>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Default Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Effective Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {codes.map((code) => (
                            <TableRow key={code.id}>
                                <TableCell className="font-medium">{code.code}</TableCell>
                                <TableCell>{code.description}</TableCell>
                                <TableCell>
                                    {categories.find(c => c.id === code.category_id)?.name}
                                </TableCell>
                                <TableCell>
                                    {code.default_price ? formatCurrency(code.default_price) : '-'}
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs ${code.status === 'active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {code.status}
                                    </span>
                                </TableCell>
                                <TableCell>{new Date(code.effective_date).toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <AddBillingCodeDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                categories={categories}
            />
        </div>
    )
}
