import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Search, MoreVertical, ArrowUpDown, User, Mail, Phone, MapPin, Briefcase, CreditCard, Calendar } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ComposedChart,
  Bar
} from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Investment {
  id: string;
  user_id: string;
  amount: number;
  investment_type: string;
  term: string;
  total_increase: number;
  payment_method: string;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  withdrawn_at: string | null;
  full_name: string;
  amount_return_annual: number;
  amount_return_monthly: number;
  interests: number;
  amount_withdrawed: number | null;
  investment_to: string;
  cancellation_fee: number | null;
  cancelation_percent: number;
  status: string;
}

interface UserAccount {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  profile_picture_url: string | null;
  date_of_birth: string;
  address: string;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  employment_status: string;
  monthly_income: number;
  credit_score: number | null;
  is_verified: boolean;
  province: string | null;
}

// Sample data for the forex graph
const generateForexData = () => {
  const data = [];
  let value = 1000;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = 0; i < 12; i++) {
    const change = (Math.random() - 0.3) * 500; // Bias towards positive growth
    value += change;
    const open = value - change;
    const close = value;
    const high = Math.max(open, close) + Math.random() * 100;
    const low = Math.min(open, close) - Math.random() * 100;
    
    data.push({
      date: months[i],
      value: Math.max(value, 0),
      open,
      high,
      low,
      close
    });
  }
  return data;
}

const forexData = generateForexData();

export function InvestmentsTable() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [chartType, setChartType] = useState<"line" | "candlestick">("line");
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    try {
      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvestments(data || []);
    } catch (error) {
      console.error("Error fetching investments:", error);
      toast({
        title: "Error",
        description: "Failed to fetch investments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users_account")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch user details",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleUserClick = async (userId: string) => {
    const userDetails = await fetchUserDetails(userId);
    if (userDetails) {
      setSelectedUser(userDetails);
      setIsUserModalOpen(true);
    }
  };

  const handleStatusChange = async (investmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("investments")
        .update({ status: newStatus })
        .eq("id", investmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Investment status updated successfully",
      });

      // Refresh the investments list
      fetchInvestments();
    } catch (error) {
      console.error("Error updating investment status:", error);
      toast({
        title: "Error",
        description: "Failed to update investment status",
        variant: "destructive",
      });
    }
  };

  const filteredInvestments = investments.filter((investment) => {
    const matchesSearch = investment.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || investment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/20">Active</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/20">Cancelled</Badge>;
      case "withdrawn":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/20">Withdrawn</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/20">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy HH:mm");
  };

  // Custom candlestick component
  const CustomCandlestick = (props: any) => {
    const { x, y, width, height, low, high, open, close } = props;
    const isGreen = close > open;
    const color = isGreen ? "#22C55E" : "#EF4444";
    const w = Math.max(1, width);
    
    return (
      <g>
        {/* Vertical line */}
        <line 
          x1={x + w / 2} 
          y1={y + height - (high - low) / 10} 
          x2={x + w / 2} 
          y2={y + height - (close - low) / 10} 
          stroke={color} 
          strokeWidth={1} 
        />
        {/* Body */}
        <rect 
          x={x} 
          y={y + height - (Math.max(open, close) - low) / 10} 
          width={w} 
          height={Math.abs(close - open) / 10} 
          fill={color} 
        />
      </g>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Profile Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="max-w-md bg-[#1B1B2C] border-green-500/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">User Profile</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <User className="h-8 w-8 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedUser.full_name}</h3>
                  <p className="text-green-400">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-400" />
                  <span className="text-white">{selectedUser.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-400" />
                  <span className="text-white">{selectedUser.address}, {selectedUser.city}, {selectedUser.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-green-400" />
                  <span className="text-white">Employment: {selectedUser.employment_status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-green-400" />
                  <span className="text-white">Monthly Income: {formatCurrency(selectedUser.monthly_income)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-400" />
                  <span className="text-white">Date of Birth: {format(new Date(selectedUser.date_of_birth), "dd MMM yyyy")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={selectedUser.is_verified ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                    {selectedUser.is_verified ? "Verified" : "Not Verified"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Forex Graph - Made smaller */}
      <div className="bg-[#1B1B2C] p-4 rounded-lg border border-green-500/20">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-white">Green Fina Performance</h3>
          <Tabs value={chartType} onValueChange={(value) => setChartType(value as "line" | "candlestick")}>
            <TabsList className="bg-[#2A2A3C]">
              <TabsTrigger value="line" className="data-[state=active]:bg-green-500/20">Line</TabsTrigger>
              <TabsTrigger value="candlestick" className="data-[state=active]:bg-green-500/20">Candlestick</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "line" ? (
              <LineChart data={forexData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1B1B2C',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    borderRadius: '0.5rem'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#22C55E" 
                  strokeWidth={2}
                  dot={{ fill: '#22C55E' }}
                  animationDuration={2000}
                  animationBegin={0}
                />
              </LineChart>
            ) : (
              <ComposedChart data={forexData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1B1B2C',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    borderRadius: '0.5rem'
                  }}
                />
                {forexData.map((entry, index) => (
                  <CustomCandlestick
                    key={`candlestick-${index}`}
                    x={index * (100 / forexData.length)}
                    y={0}
                    width={100 / forexData.length - 2}
                    height={200}
                    low={entry.low}
                    high={entry.high}
                    open={entry.open}
                    close={entry.close}
                  />
                ))}
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm bg-[#1B1B2C] border-green-500/20 text-white placeholder:text-white/50 focus:border-green-500/50"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-md border border-green-500/20 bg-[#1B1B2C] text-white focus:border-green-500/50"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </div>

      <div className="rounded-md border border-green-500/20 bg-[#1B1B2C] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-green-500/5 border-green-500/20">
              <TableHead className="text-green-400/70 font-medium">Investor</TableHead>
              <TableHead className="text-green-400/70 font-medium">Amount</TableHead>
              <TableHead className="text-green-400/70 font-medium">Type</TableHead>
              <TableHead className="text-green-400/70 font-medium">Term</TableHead>
              <TableHead className="text-green-400/70 font-medium">Annual Return</TableHead>
              <TableHead className="text-green-400/70 font-medium">Monthly Return</TableHead>
              <TableHead className="text-green-400/70 font-medium">Interest Rate</TableHead>
              <TableHead className="text-green-400/70 font-medium">Total Increase</TableHead>
              <TableHead className="text-green-400/70 font-medium">Withdrawn Amount</TableHead>
              <TableHead className="text-green-400/70 font-medium">Status</TableHead>
              <TableHead className="text-green-400/70 font-medium">Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvestments.map((investment) => (
              <TableRow 
                key={investment.id} 
                className="hover:bg-green-500/5 border-green-500/20 transition-colors"
              >
                <TableCell className="font-medium text-white">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-green-500/20 hover:bg-green-500/30"
                      onClick={() => handleUserClick(investment.user_id)}
                    >
                      <User className="h-4 w-4 text-green-400" />
                    </Button>
                    <span>{investment.full_name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-white">{formatCurrency(investment.amount)}</TableCell>
                <TableCell className="text-white">{investment.investment_type}</TableCell>
                <TableCell className="text-white">{investment.term} months</TableCell>
                <TableCell className="text-green-400">{formatCurrency(investment.amount_return_annual)}</TableCell>
                <TableCell className="text-green-400">{formatCurrency(investment.amount_return_monthly)}</TableCell>
                <TableCell className="text-white">{investment.interests}%</TableCell>
                <TableCell className="text-green-400">{formatCurrency(investment.total_increase)}</TableCell>
                <TableCell className="text-yellow-400">
                  {investment.amount_withdrawed ? formatCurrency(investment.amount_withdrawed) : '-'}
                </TableCell>
                <TableCell>
                  <Select
                    value={investment.status}
                    onValueChange={(value) => handleStatusChange(investment.id, value)}
                  >
                    <SelectTrigger className="w-[130px] bg-[#1B1B2C] border-green-500/20 text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1B1B2C] border-green-500/20">
                      <SelectItem value="active" className="text-green-400">Active</SelectItem>
                      <SelectItem value="cancelled" className="text-red-400">Cancelled</SelectItem>
                      <SelectItem value="withdrawn" className="text-yellow-400">Withdrawn</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-white/70">{formatDate(investment.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 