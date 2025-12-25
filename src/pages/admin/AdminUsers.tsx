import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { escapeLikePattern } from "@/lib/searchUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Search, Ban, UserCheck, Shield, Eye, ShieldCheck, ShieldAlert, RotateCcw, UserX } from "lucide-react";
import { format } from "date-fns";

type AppRole = "admin" | "moderator" | "user";

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
  is_adult: boolean | null;
  kyc_verified: boolean | null;
  is_banned: boolean | null;
  banned_at: string | null;
  banned_reason: string | null;
  is_deleted: boolean | null;
  deleted_at: string | null;
  created_at: string;
}

const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreEmail, setRestoreEmail] = useState("");
  const [restoreFullName, setRestoreFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("user");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchTerm) {
        const safeTerm = escapeLikePattern(searchTerm);
        query = query.or(`full_name.ilike.%${safeTerm}%,email.ilike.%${safeTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UserProfile[];
    },
  });

  const { data: userRoles } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (error) throw error;
      return data;
    },
  });

  const banMutation = useMutation({
    mutationFn: async ({ userId, ban }: { userId: string; ban: boolean }) => {
      const updateData = ban
        ? { is_banned: true, banned_at: new Date().toISOString(), banned_reason: banReason }
        : { is_banned: false, banned_at: null, banned_reason: null };

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: (_, { ban }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: ban ? "User Banned" : "User Unbanned",
        description: ban
          ? "The user has been banned from the platform."
          : "The user has been restored.",
      });
      setBanDialogOpen(false);
      setBanReason("");
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // First, delete existing roles for this user
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      // Then insert the new role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast({
        title: "Role Updated",
        description: `User role has been changed to ${selectedRole}.`,
      });
      setRoleDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      console.error("Role update error:", error);
      toast({
        title: "Error",
        description: "Failed to update user role. Make sure you have admin permissions.",
        variant: "destructive",
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async ({ userId, email, fullName }: { userId: string; email: string; fullName: string }) => {
      const { data, error } = await supabase.rpc('restore_deleted_account', {
        _user_id: userId,
        _email: email,
        _full_name: fullName || null,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to restore account');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Account Restored",
        description: "The user account has been restored successfully.",
      });
      setRestoreDialogOpen(false);
      setRestoreEmail("");
      setRestoreFullName("");
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to restore account.",
        variant: "destructive",
      });
    },
  });

  const getUserRole = (userId: string): AppRole => {
    const role = userRoles?.find((r) => r.user_id === userId);
    return (role?.role as AppRole) || "user";
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-primary/20 text-primary"><ShieldAlert className="w-3 h-3 mr-1" />Admin</Badge>;
      case "moderator":
        return <Badge className="bg-accent/20 text-accent"><ShieldCheck className="w-3 h-3 mr-1" />Moderator</Badge>;
      default:
        return <Badge variant="secondary">User</Badge>;
    }
  };

  const handleBanClick = (user: UserProfile) => {
    setSelectedUser(user);
    setBanDialogOpen(true);
  };

  const handleViewClick = (user: UserProfile) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

  const handleRoleClick = (user: UserProfile) => {
    setSelectedUser(user);
    setSelectedRole(getUserRole(user.id));
    setRoleDialogOpen(true);
  };

  const handleRestoreClick = (user: UserProfile) => {
    setSelectedUser(user);
    setRestoreEmail("");
    setRestoreFullName("");
    setRestoreDialogOpen(true);
  };

  return (
    <>
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">View, edit, and manage platform users and roles</p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : users?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              {user.full_name?.[0]?.toUpperCase() || "?"}
                            </div>
                          )}
                        </div>
                        <span className="font-medium">
                          {user.full_name || "Unnamed"}
                          {user.is_deleted && (
                            <Badge variant="outline" className="ml-2 text-xs text-muted-foreground">
                              <UserX className="w-3 h-3 mr-1" />
                              Deleted
                            </Badge>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email || "—"}</TableCell>
                    <TableCell>{getRoleBadge(getUserRole(user.id))}</TableCell>
                    <TableCell>
                      {user.is_deleted ? (
                        <Badge variant="outline" className="text-muted-foreground">
                          <UserX className="w-3 h-3 mr-1" />
                          Deleted
                        </Badge>
                      ) : user.is_banned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : (
                        <Badge className="bg-green-500/20 text-green-600">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.is_adult && (
                          <Badge variant="outline" className="text-xs">18+</Badge>
                        )}
                        {user.kyc_verified && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-600">KYC</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(user.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewClick(user)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRoleClick(user)}
                          title="Manage Role"
                          className="text-primary"
                          disabled={user.is_deleted === true}
                        >
                          <Shield className="w-4 h-4" />
                        </Button>
                        {user.is_deleted ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRestoreClick(user)}
                            className="text-blue-500"
                            title="Restore Account"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleBanClick(user)}
                            className={user.is_banned ? "text-green-600" : "text-destructive"}
                            title={user.is_banned ? "Unban User" : "Ban User"}
                          >
                            {user.is_banned ? (
                              <UserCheck className="w-4 h-4" />
                            ) : (
                              <Ban className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Ban/Unban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.is_banned ? "Unban User" : "Ban User"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.is_banned
                ? `Are you sure you want to unban ${selectedUser?.full_name || "this user"}?`
                : `Are you sure you want to ban ${selectedUser?.full_name || "this user"}? They will lose access to the platform.`}
            </DialogDescription>
          </DialogHeader>

          {!selectedUser?.is_banned && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Ban Reason</label>
              <Textarea
                placeholder="Enter the reason for banning this user..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={selectedUser?.is_banned ? "default" : "destructive"}
              onClick={() =>
                selectedUser && banMutation.mutate({
                  userId: selectedUser.id,
                  ban: !selectedUser.is_banned,
                })
              }
              disabled={banMutation.isPending}
            >
              {selectedUser?.is_banned ? "Unban User" : "Ban User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Management Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Manage User Role
            </DialogTitle>
            <DialogDescription>
              Change the role for {selectedUser?.full_name || selectedUser?.email || "this user"}.
              This will affect their permissions on the platform.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Role</label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-normal">User</Badge>
                      <span className="text-muted-foreground text-xs">Default access</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="moderator">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-accent/20 text-accent font-normal">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Moderator
                      </Badge>
                      <span className="text-muted-foreground text-xs">Can review submissions</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/20 text-primary font-normal">
                        <ShieldAlert className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                      <span className="text-muted-foreground text-xs">Full access</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <p className="font-medium">Role Permissions:</p>
              {selectedRole === "user" && (
                <ul className="list-disc pl-4 text-muted-foreground space-y-1">
                  <li>Participate in contests</li>
                  <li>Submit photos</li>
                  <li>View leaderboard</li>
                </ul>
              )}
              {selectedRole === "moderator" && (
                <ul className="list-disc pl-4 text-muted-foreground space-y-1">
                  <li>All user permissions</li>
                  <li>Review and moderate submissions</li>
                  <li>Handle reports</li>
                </ul>
              )}
              {selectedRole === "admin" && (
                <ul className="list-disc pl-4 text-muted-foreground space-y-1">
                  <li>All moderator permissions</li>
                  <li>Manage users and roles</li>
                  <li>Create and manage contests</li>
                  <li>Process payments</li>
                  <li>Access analytics</li>
                </ul>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedUser && roleMutation.mutate({
                  userId: selectedUser.id,
                  role: selectedRole,
                })
              }
              disabled={roleMutation.isPending}
              className="gradient-primary"
            >
              {roleMutation.isPending ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted overflow-hidden">
                  {selectedUser.avatar_url ? (
                    <img
                      src={selectedUser.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl text-muted-foreground">
                      {selectedUser.full_name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.full_name || "Unnamed"}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium">{selectedUser.phone || "Not provided"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Role:</span>
                  <div className="mt-1">{getRoleBadge(getUserRole(selectedUser.id))}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Age Verified:</span>
                  <p className="font-medium">{selectedUser.is_adult ? "Yes" : "No"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">KYC Verified:</span>
                  <p className="font-medium">{selectedUser.kyc_verified ? "Yes" : "No"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="font-medium">
                    {selectedUser.is_deleted ? "Deleted" : selectedUser.is_banned ? "Banned" : "Active"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Joined:</span>
                  <p className="font-medium">
                    {format(new Date(selectedUser.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              {selectedUser.is_deleted && selectedUser.deleted_at && (
                <div className="bg-muted p-4 rounded-lg border">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <UserX className="w-4 h-4" />
                    Account Deleted
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Deleted on {format(new Date(selectedUser.deleted_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              )}

              {selectedUser.is_banned && selectedUser.banned_reason && (
                <div className="bg-destructive/10 p-4 rounded-lg">
                  <p className="text-sm font-medium text-destructive">Ban Reason:</p>
                  <p className="text-sm text-muted-foreground mt-1">{selectedUser.banned_reason}</p>
                  {selectedUser.banned_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Banned on {format(new Date(selectedUser.banned_at), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Account Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-blue-500" />
              Restore Deleted Account
            </DialogTitle>
            <DialogDescription>
              Restore this account by providing a new email and name. The user will be able to log in again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Email Address *</label>
              <Input
                placeholder="user@example.com"
                type="email"
                value={restoreEmail}
                onChange={(e) => setRestoreEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This email will be used for the restored account
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                placeholder="John Doe"
                value={restoreFullName}
                onChange={(e) => setRestoreFullName(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedUser && restoreMutation.mutate({
                  userId: selectedUser.id,
                  email: restoreEmail,
                  fullName: restoreFullName,
                })
              }
              disabled={restoreMutation.isPending || !restoreEmail}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {restoreMutation.isPending ? "Restoring..." : "Restore Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminUsers;
