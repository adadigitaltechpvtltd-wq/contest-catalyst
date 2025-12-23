import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";
import { format } from "date-fns";

interface Report {
  id: string;
  reason: string;
  description: string | null;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  created_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
  reporter_id: string | null;
  reported_user_id: string | null;
  submission_id: string | null;
  evidence_urls: string[] | null;
}

const statusConfig = {
  pending: { label: "Pending", icon: Clock, className: "bg-yellow-500/20 text-yellow-600" },
  reviewed: { label: "Reviewed", icon: Eye, className: "bg-blue-500/20 text-blue-600" },
  resolved: { label: "Resolved", icon: CheckCircle, className: "bg-green-500/20 text-green-600" },
  dismissed: { label: "Dismissed", icon: XCircle, className: "bg-muted text-muted-foreground" },
};

const AdminReports = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-reports", statusFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as "pending" | "reviewed" | "resolved" | "dismissed");
      }

      if (searchTerm) {
        query = query.or(`reason.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Report[];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["profiles-for-reports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, email");
      if (error) throw error;
      return data;
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const updateData: Record<string, unknown> = {
        status,
        resolution_notes: notes,
      };

      if (status === "resolved" || status === "dismissed") {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = user?.id;
      }

      const { error } = await supabase.from("reports").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      toast({ title: "Report Updated", description: "The report status has been updated." });
      setSelectedReport(null);
      setResolutionNotes("");
      setNewStatus("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update report.", variant: "destructive" });
    },
  });

  const getProfileName = (userId: string | null) => {
    if (!userId) return "Unknown";
    const profile = profiles?.find((p) => p.id === userId);
    return profile?.full_name || profile?.email || "Unknown";
  };

  const handleResolve = () => {
    if (selectedReport && newStatus) {
      updateReportMutation.mutate({
        id: selectedReport.id,
        status: newStatus,
        notes: resolutionNotes,
      });
    }
  };

  const pendingCount = reports?.filter((r) => r.status === "pending").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Abuse Reports</h1>
          <p className="text-muted-foreground mt-1">Review and manage user reports</p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-destructive/20 text-destructive text-lg px-4 py-2">
            <AlertTriangle className="w-4 h-4 mr-2" />
            {pendingCount} Pending
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Report</TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead>Reported User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading reports...
                </TableCell>
              </TableRow>
            ) : reports?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No reports found
                </TableCell>
              </TableRow>
            ) : (
              reports?.map((report) => {
                const config = statusConfig[report.status];
                const StatusIcon = config.icon;
                return (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium text-foreground truncate">{report.reason}</p>
                        {report.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {report.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getProfileName(report.reporter_id)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getProfileName(report.reported_user_id)}
                    </TableCell>
                    <TableCell>
                      <Badge className={config.className}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(report.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report);
                          setNewStatus(report.status);
                          setResolutionNotes(report.resolution_notes || "");
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Report</DialogTitle>
            <DialogDescription>
              Review the details and take action on this report
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Reason</label>
                  <p className="font-medium">{selectedReport.reason}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Reported On</label>
                  <p className="font-medium">
                    {format(new Date(selectedReport.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Reporter</label>
                  <p className="font-medium">{getProfileName(selectedReport.reporter_id)}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Reported User</label>
                  <p className="font-medium">{getProfileName(selectedReport.reported_user_id)}</p>
                </div>
              </div>

              {selectedReport.description && (
                <div>
                  <label className="text-sm text-muted-foreground">Description</label>
                  <p className="mt-1 p-3 bg-muted rounded-lg">{selectedReport.description}</p>
                </div>
              )}

              {selectedReport.evidence_urls && selectedReport.evidence_urls.length > 0 && (
                <div>
                  <label className="text-sm text-muted-foreground">Evidence</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedReport.evidence_urls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline text-sm"
                      >
                        Evidence {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-border pt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium">Update Status</label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Resolution Notes</label>
                  <Textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Add notes about the resolution..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReport(null)}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={updateReportMutation.isPending}>
              Update Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReports;
