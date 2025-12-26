import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Building2, Mail, Globe, Calendar, MessageSquare, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BrandInquiry {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  website: string | null;
  budget_range: string | null;
  message: string;
  status: string;
  created_at: string;
}

const budgetLabels: Record<string, string> = {
  "under-500": "Under $500",
  "500-1000": "$500 - $1,000",
  "1000-2500": "$1,000 - $2,500",
  "2500-5000": "$2,500 - $5,000",
  "5000-plus": "$5,000+",
  "not-sure": "Not sure yet",
};

const AdminBrandInquiries = () => {
  const { data: inquiries, isLoading } = useQuery({
    queryKey: ["brand-inquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_inquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BrandInquiry[];
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-primary/10 text-primary border-primary/20">New</Badge>;
      case "contacted":
        return <Badge className="bg-success/10 text-success border-success/20">Contacted</Badge>;
      case "closed":
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Brand Inquiries</h1>
          <p className="text-muted-foreground">View and manage brand partnership inquiries</p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Brand Inquiries</h1>
          <p className="text-muted-foreground">
            {inquiries?.length || 0} total inquiries
          </p>
        </div>
      </div>

      {!inquiries?.length ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-foreground mb-1">No inquiries yet</h3>
          <p className="text-sm text-muted-foreground">
            Brand inquiries will appear here when submitted.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inquiries.map((inquiry) => (
                <TableRow key={inquiry.id}>
                  <TableCell>
                    <div className="font-medium">{inquiry.company_name}</div>
                    {inquiry.website && (
                      <a
                        href={inquiry.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <Globe className="w-3 h-3" />
                        Website
                      </a>
                    )}
                  </TableCell>
                  <TableCell>{inquiry.contact_name}</TableCell>
                  <TableCell>
                    <a
                      href={`mailto:${inquiry.email}`}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      {inquiry.email}
                    </a>
                  </TableCell>
                  <TableCell>
                    {inquiry.budget_range ? (
                      <span className="flex items-center gap-1 text-sm">
                        <DollarSign className="w-3 h-3 text-muted-foreground" />
                        {budgetLabels[inquiry.budget_range] || inquiry.budget_range}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not specified</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(inquiry.status)}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(inquiry.created_at), "MMM d, yyyy")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            {inquiry.company_name}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Contact Person</p>
                              <p className="font-medium">{inquiry.contact_name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Email</p>
                              <a href={`mailto:${inquiry.email}`} className="font-medium text-primary hover:underline">
                                {inquiry.email}
                              </a>
                            </div>
                            {inquiry.website && (
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Website</p>
                                <a
                                  href={inquiry.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-primary hover:underline"
                                >
                                  {inquiry.website}
                                </a>
                              </div>
                            )}
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Budget Range</p>
                              <p className="font-medium">
                                {inquiry.budget_range
                                  ? budgetLabels[inquiry.budget_range] || inquiry.budget_range
                                  : "Not specified"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Status</p>
                              {getStatusBadge(inquiry.status)}
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Submitted</p>
                              <p className="font-medium">
                                {format(new Date(inquiry.created_at), "PPP 'at' p")}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              Campaign Idea / Message
                            </p>
                            <ScrollArea className="h-32 rounded-lg border p-3 bg-muted/30">
                              <p className="text-sm whitespace-pre-wrap">{inquiry.message}</p>
                            </ScrollArea>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminBrandInquiries;