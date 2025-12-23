import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Search, Ban, UserCheck, Edit, Shield, Eye } from "lucide-react";
import { format } from "date-fns";

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
  created_at: string;
}

const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
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
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
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

  const getUserRole = (userId: string) => {
    const role = userRoles?.find((r) => r.user_id === userId);
    return role?.role || "user";
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-primary/20 text-primary">Admin</Badge>;
      case "moderator":
        return <Badge className="bg-accent/20 text-accent">Moderator</Badge>;
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

  return (
    <>
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">View, edit, and manage platform users</p>
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
                        <span className="font-medium">{user.full_name || "Unnamed"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email || "—"}</TableCell>
                    <TableCell>{getRoleBadge(getUserRole(user.id))}</TableCell>
                    <TableCell>
                      {user.is_banned ? (
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
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleBanClick(user)}
                          className={user.is_banned ? "text-green-600" : "text-destructive"}
                        >
                          {user.is_banned ? (
                            <UserCheck className="w-4 h-4" />
                          ) : (
                            <Ban className="w-4 h-4" />
                          )}
                        </Button>
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
                  <p className="font-medium">{getUserRole(selectedUser.id)}</p>
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
                  <p className="font-medium">{selectedUser.is_banned ? "Banned" : "Active"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Joined:</span>
                  <p className="font-medium">
                    {format(new Date(selectedUser.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

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
    </>
  );
};

export default AdminUsers;
