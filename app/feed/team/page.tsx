"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  Shield,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  Loader2,
  AlertCircle,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVotingStore } from "@/store/useVotingStore";
import {
  apiGetTeams,
  apiCreateTeam,
  apiGetTeamMembers,
  apiAddTeamMember,
  apiRemoveTeamMember
} from "@/lib/api";

interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export default function TeamPage() {
  const { user, isInitialized } = useVotingStore();

  const [teams, setTeams] = useState<any[]>([]);
  const [activeTeam, setActiveTeam] = useState<any | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("Election Manager");

  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  const loadMembers = async (teamId: string) => {
    try {
      const membersRes = await apiGetTeamMembers(teamId);
      if (membersRes) {
        const mapped = membersRes.map((m: any) => {
          const userObj = m.user || {};
          const firstName = userObj.first_name || m.first_name || "";
          const lastName = userObj.last_name || m.last_name || "";
          let fullName = `${firstName} ${lastName}`.trim();
          if (!fullName) {
            fullName = userObj.username || m.username || userObj.email || m.email || "Team Member";
          }
          return {
            id: m.id,
            userId: m.user_id || userObj.id || m.id,
            name: fullName,
            email: userObj.email || m.email || "",
            role: m.role || "Viewer",
            status: m.status || "active"
          };
        });
        setMembers(mapped);
      } else {
        setMembers([]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load team members.");
    }
  };

  const loadTeamsAndMembers = React.useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const teamsRes = await apiGetTeams();
      if (teamsRes && teamsRes.length > 0) {
        setTeams(teamsRes);
        const defaultTeam = teamsRes[0];
        setActiveTeam(defaultTeam);
        await loadMembers(defaultTeam.id);
      } else {
        setTeams([]);
        setActiveTeam(null);
        setMembers([]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load teams.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isInitialized && user) {
      loadTeamsAndMembers();
    }
  }, [isInitialized, user, loadTeamsAndMembers]);

  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName) return;
    setLoading(true);
    setErrorMessage("");
    try {
      await apiCreateTeam({ name: newTeamName, description: "Organization administrative team" });
      setNewTeamName("");
      setShowCreateTeamModal(false);
      await loadTeamsAndMembers();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create team.");
      setLoading(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName || !activeTeam) return;
    setLoading(true);
    setErrorMessage("");
    try {
      await apiAddTeamMember(activeTeam.id, { email: inviteEmail, role: inviteRole });
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteName("");
      await loadMembers(activeTeam.id);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to add team member.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!activeTeam) return;
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    if (!confirm(`Are you sure you want to revoke access for ${member.name}?`)) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const targetId = member.userId || member.id;
      await apiRemoveTeamMember(activeTeam.id, targetId);
      await loadMembers(activeTeam.id);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to remove team member.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && teams.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="text-primary w-6 h-6" /> Team Management
          </h1>
          <p className="text-xs text-white/50">
            {activeTeam ? `Managing administrative team: ${activeTeam.name}` : "Manage administrative access levels and roles for your organization."}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeTeam && (
            <Button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:shadow-[0_0_20px_rgba(49,107,243,0.3)] transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Invite Member
            </Button>
          )}
          <Button
            onClick={() => setShowCreateTeamModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white/60" /> New Team
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Member List & Permission Matrix */}
      {activeTeam ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Member List */}
          <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm space-y-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Active Administrative Team</h2>

            {members.length === 0 ? (
              <p className="text-xs text-white/40">No team members added yet.</p>
            ) : (
              <div className="space-y-4">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-xs font-extrabold text-white">
                        {member.name[0]?.toUpperCase() || "M"}
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
            )}
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
      ) : (
        <div className="border border-white/5 rounded-3xl p-12 text-center bg-white/[0.01] space-y-4">
          <Users className="w-12 h-12 text-white/20 mx-auto" />
          <h3 className="text-base font-bold text-white">No Team Configured</h3>
          <p className="text-xs text-white/40 max-w-sm mx-auto">
            You don&apos;t have any administrative teams yet. Create a team to delegate admin privileges and manage members.
          </p>
          <Button
            onClick={() => setShowCreateTeamModal(true)}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:shadow-[0_0_20px_rgba(49,107,243,0.3)] transition-all cursor-pointer"
          >
            Create Team
          </Button>
        </div>
      )}

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
                  onChange={e => setInviteRole(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-[#080c1c] border border-white/10 text-white text-xs focus:border-primary focus:outline-none appearance-none font-sans"
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

      {/* Modal: Create Team */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0c122c] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-40 h-40 rounded-full bg-primary/20 blur-[55px] pointer-events-none -z-10" />

            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                <Users className="w-5 h-5 text-primary animate-pulse" /> Create New Team
              </h3>
              <button
                onClick={() => setShowCreateTeamModal(false)}
                className="text-white/40 hover:text-white transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/70">Team Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Executive Board"
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:border-primary focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/5 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold transition-all text-white/80"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:shadow-[0_0_20px_rgba(49,107,243,0.3)] transition-all"
                >
                  Create Team
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
