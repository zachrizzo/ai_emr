'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const signupSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  organizationName: z.string().min(1, 'Organization name is required'),
  organizationType: z.string().min(1, 'Organization type is required'),
  phone: z.string().optional(),
  address: z.string().min(1, 'Organization address is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    try {
      // 1. Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      })

      if (authError) throw authError

      if (authData.user) {
        // 2. Create organization
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: data.organizationName,
            type: data.organizationType,
            address: data.address,
            phone: data.phone,
            email: data.email,
          })
          .select()
          .single()

        if (orgError) throw orgError

        // 3. Create organization member relationship
        const { error: memberError } = await supabase
          .from('organization_members')
          .insert({
            user_id: authData.user.id,
            organization_id: orgData.id,
            role: 'admin',
          })

        if (memberError) throw memberError

        // 4. Update user profile
        const { error: profileError } = await supabase
          .from('users')
          .update({
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
          })
          .eq('id', authData.user.id)

        if (profileError) throw profileError

        toast({
          title: "Account created successfully",
          description: "You can now log in with your credentials.",
        })

        router.push('/login')
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 p-4">
      <Card className="w-full max-w-2xl border-none shadow-2xl bg-white/80 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Create your Account</CardTitle>
          <p className="text-center text-gray-600">Sign up to start managing your practice</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <div>
                  <Input
                    placeholder="First Name"
                    {...register('firstName')}
                    error={errors.firstName?.message}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Last Name"
                    {...register('lastName')}
                    error={errors.lastName?.message}
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    {...register('email')}
                    error={errors.email?.message}
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    {...register('password')}
                    error={errors.password?.message}
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Confirm Password"
                    {...register('confirmPassword')}
                    error={errors.confirmPassword?.message}
                  />
                </div>
              </div>

              {/* Organization Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Organization Information</h3>
                <div>
                  <Input
                    placeholder="Organization Name"
                    {...register('organizationName')}
                    error={errors.organizationName?.message}
                  />
                </div>
                <div>
                  <Select
                    onValueChange={(value) => setValue('organizationType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Organization Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hospital">Hospital</SelectItem>
                      <SelectItem value="clinic">Clinic</SelectItem>
                      <SelectItem value="private_practice">Private Practice</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.organizationType && (
                    <p className="text-sm text-red-500 mt-1">{errors.organizationType.message}</p>
                  )}
                </div>
                <div>
                  <Input
                    placeholder="Address"
                    {...register('address')}
                    error={errors.address?.message}
                  />
                </div>
                <div>
                  <Input
                    type="tel"
                    placeholder="Phone (optional)"
                    {...register('phone')}
                    error={errors.phone?.message}
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

