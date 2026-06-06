"use client";

import * as React from "react";
import { useState } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  Shield,
  CheckCircle,
  HelpCircle,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Election Manager" | "Viewer";
  status: "active" | "invited";
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([
    { id: "m1", name: "Arnab (You)", email: "barnalichakrabarty8@gmail.com", role: "Owner", status: "active" },
    { id: "m2", name: "Sarah Connor", email: "sarah@securevote.io", role: "Admin", status: "active" },
    { id: "m3", name: "John Doe", email: "john@securevote.io", role: "Election Manager", status: "active" },
    { id: "m4", name: "Kyle Reese", email: "kyle@securevote.io", role: "Viewer", status: "invited" }
  ]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamMember["role"]>("Election Manager");

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;

    const newMember: TeamMember = {
      id: `m_${Date.now()}`,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      status: "invited"
    };

    setMembers([...members, newMember]);
    setShowInviteModal(false);
    setInviteEmail("");
    setInviteName("");
  };

  const handleRemoveMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-6 select-none relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="text-primary w-6 h-6" /> Team Management
          </h1>
          <p className="text-xs text-white/50">Manage administrative access levels and roles for your organization.</p>
        </div>

        <Button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:shadow-[0_0_20px_rgba(49,107,243,0.3)] transition-all cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" /> Invite Member
        </Button>
      </div>

      {/* Main Grid: Member List & Permission Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Member List */}
        <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm space-y-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Active Administrative Team</h2>

          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-xs font-extrabold text-white">
                    {member.name[0].toUpperCase()}
                  </div>
                  <div className="space-y-0.5 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white">{member.name}</p>
                      {member.status === "invited" && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 border border-white/5 uppercase font-bold tracking-wider">
                          Invited
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/40 font-mono">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold">
                    {member.role}
                  </span>

                  {member.role !== "Owner" && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-2 rounded-xl bg-red-500/10 border border-red-500/15 hover:bg-red-500/20 text-red-400 transition-all cursor-pointer"
                      title="Revoke Invite/Access"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Permission Matrix */}
        <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm space-y-4">
          <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-primary" /> Permission Matrix
          </h3>

          <div className="space-y-3.5 text-xs text-white/70">
            {[
              { role: "Owner", desc: "Full admin privileges, billing, team additions, election launching." },
              { role: "Admin", desc: "Manage elections, edit drafts, view logs, invite team members." },
              { role: "Election Manager", desc: "Create, edit & audit elections. Manage instant polls." },
              { role: "Viewer", desc: "Audit and view results only. Cannot launch or delete elections." }
            ].map((p, i) => (
              <div key={i} className="space-y-1 p-3 rounded-xl bg-white/[0.01] border border-white/5">
                <p className="font-bold text-white flex items-center justify-between">
                  <span>{p.role}</span>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                </p>
                <p className="text-[10px] text-white/40 leading-normal">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Invite Team Member */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0c122c] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-40 h-40 rounded-full bg-primary/20 blur-[55px] pointer-events-none -z-10" />

            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                <UserPlus className="w-5 h-5 text-primary" /> Invite Team Member
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-white/40 hover:text-white transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/70">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Connor"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/70">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah@securevote.io"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/70">Assign Role</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as any)}
                  className="w-full h-11 px-4 rounded-xl bg-[#080c1c] border border-white/10 text-white text-xs focus:border-primary focus:outline-none appearance-none"
                >
                  <option value="Admin">Admin</option>
                  <option value="Election Manager">Election Manager</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/5 mt-6">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold transition-all text-white/80"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:shadow-[0_0_20px_rgba(49,107,243,0.3)] transition-all"
                >
                  Send Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
