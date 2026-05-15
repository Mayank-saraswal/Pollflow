'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User, Mail, Save, Shield, Trash2,
  Bell, Globe, EyeOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PageHeader } from '@/components/shared/page-header'
import { toast } from 'sonner'

const profileSchema = z.object({
  name:  z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email'),
})
type ProfileInput = z.infer<typeof profileSchema>

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name:  session?.user?.name  ?? '',
      email: session?.user?.email ?? '',
    },
  })

  const onSubmit = async (data: ProfileInput) => {
    setSaving(true)
    try {
      // TODO: wire to PATCH /api/user/profile
      await new Promise((r) => setTimeout(r, 600))
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = `w-full h-11 px-4 rounded-xl
    bg-white/[0.04] border border-white/[0.08]
    text-white text-sm font-body
    placeholder:text-white/25
    focus:outline-none focus:border-white/[0.20]
    focus:ring-2 focus:ring-white/[0.05] transition-colors`

  const SECTIONS = [
    {
      id: 'profile',
      icon: User,
      title: 'Profile',
      desc: 'Your public identity on PollFlow',
    },
    {
      id: 'security',
      icon: Shield,
      title: 'Security',
      desc: 'Password and authentication settings',
    },
    {
      id: 'danger',
      icon: Trash2,
      title: 'Danger Zone',
      desc: 'Irreversible account actions',
    },
  ]

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <PageHeader
        title="Settings"
        description="Manage your account preferences."
      />

      {/* Profile section */}
      <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6
                     flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-white/40" />
          <h2 className="font-display font-semibold text-white text-base">Profile</h2>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 ring-2 ring-white/10">
            <AvatarImage src={session?.user?.image ?? ''} />
            <AvatarFallback className="bg-white/[0.08] text-white font-display
                                      text-xl font-semibold">
              {session?.user?.name?.[0]?.toUpperCase() ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <p className="font-body text-white/50 text-sm">Profile picture</p>
            <p className="font-body text-white/25 text-xs">
              Managed by your OAuth provider
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="font-body text-white/60 text-xs">Full name</Label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2
                             w-4 h-4 text-white/25 pointer-events-none" />
              <input {...register('name')} className={`${inputCls} pl-10`} />
            </div>
            {errors.name && (
              <p className="text-red-400 text-xs">{errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="font-body text-white/60 text-xs">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2
                             w-4 h-4 text-white/25 pointer-events-none" />
              <input
                {...register('email')}
                type="email"
                className={`${inputCls} pl-10`}
              />
            </div>
            {errors.email && (
              <p className="text-red-400 text-xs">{errors.email.message}</p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              loading={saving}
              disabled={!isDirty}
              size="sm"
              className="gap-2 font-display"
            >
              <Save className="w-3.5 h-3.5" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Security section */}
      <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6
                     flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-white/40" />
          <h2 className="font-display font-semibold text-white text-base">Security</h2>
        </div>
        <div className="flex items-center justify-between py-2">
          <div className="flex flex-col gap-1">
            <p className="font-body text-white/70 text-sm">Password</p>
            <p className="font-body text-white/30 text-xs">
              {session?.user ? 'Change your account password' : 'Set via OAuth provider'}
            </p>
          </div>
          <Button variant="secondary" size="sm" className="font-body">
            Change password
          </Button>
        </div>
        <div className="h-px bg-white/[0.05]" />
        <div className="flex items-center justify-between py-2">
          <div className="flex flex-col gap-1">
            <p className="font-body text-white/70 text-sm">Connected accounts</p>
            <p className="font-body text-white/30 text-xs">
              OAuth providers linked to your account
            </p>
          </div>
          <div className="flex items-center gap-2">
            {['Google', 'GitHub'].map((provider) => (
              <span
                key={provider}
                className="badge badge-default text-xs"
              >
                {provider}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-[#111113] border border-red-500/[0.15] rounded-2xl p-6
                     flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-red-400/70" />
          <h2 className="font-display font-semibold text-red-400/80 text-base">
            Danger Zone
          </h2>
        </div>
        <div className="flex items-center justify-between py-2">
          <div className="flex flex-col gap-1">
            <p className="font-body text-white/70 text-sm">Delete account</p>
            <p className="font-body text-white/30 text-xs">
              Permanently delete your account and all your polls.
              This cannot be undone.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="shrink-0 font-display"
            onClick={() => toast.error('Contact support to delete your account.')}
          >
            Delete account
          </Button>
        </div>
      </div>
    </div>
  )
}
