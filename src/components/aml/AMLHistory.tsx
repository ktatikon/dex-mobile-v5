import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  History, 
  Eye, 
  RefreshCw, 
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getAMLHistory, recheckAddress } from '@/services/amlService';
import type { AMLCheckRequest } from '@/types/aml';
import { NETWORK_CONFIG, RISK_LEVEL_CONFIG } from '@/types/aml';

interface AMLHistoryProps {
  refreshTrigger?: number; // Used to trigger refresh from parent
}

const AMLHistory: React.FC<AMLHistoryProps> = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [checks, setChecks] = useState<AMLCheckRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [recheckingId, setRecheckingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalChecks, setTotalChecks] = useState(0);
  const [selectedCheck, setSelectedCheck] = useState<AMLCheckRequest | null>(null);
  
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalChecks / itemsPerPage);

  const fetchHistory = async (page: number = 1) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const offset = (page - 1) * itemsPerPage;
      const result = await getAMLHistory(user.id, {}, itemsPerPage, offset);
      
      setChecks(result.checks);
      setTotalChecks(result.total);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching AML history:', error);
      toast({
        title: "Error",
        description: "Failed to load AML check history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, [user, refreshTrigger]);

  const handleRecheck = async (checkId: string) => {
    if (!user) return;
    
    setRecheckingId(checkId);
    try {
      const result = await recheckAddress(user.id, checkId);
      
      if (result.success) {
        toast({
          title: "Recheck Initiated",
          description: "Address is being re-analyzed",
        });
        
        // Refresh the history
        await fetchHistory(currentPage);
      } else {
        toast({
          title: "Recheck Failed",
          description: result.error || "Failed to initiate recheck",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error rechecking address:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during recheck",
        variant: "destructive",
      });
    } finally {
      setRecheckingId(null);
    }
  };

  const handleViewDetails = (check: AMLCheckRequest) => {
    setSelectedCheck(check);
  };

  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRiskBadge = (riskLevel?: string) => {
    if (!riskLevel) return null;
    
    const config = RISK_LEVEL_CONFIG[riskLevel as keyof typeof RISK_LEVEL_CONFIG];
    if (!config) return null;
    
    return (
      <Badge className={`${config.bgColor} text-white`}>
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-600', label: 'Pending' },
      completed: { color: 'bg-green-600', label: 'Completed' },
      failed: { color: 'bg-red-600', label: 'Failed' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  if (loading && checks.length === 0) {
    return (
      <Card className="bg-dex-dark/80 border-dex-secondary/30 shadow-lg shadow-dex-secondary/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-dex-primary" />
            <span className="ml-2 text-white">Loading AML history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-dex-dark/80 border-dex-secondary/30 shadow-lg shadow-dex-secondary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <History className="h-5 w-5 text-dex-primary" />
          AML Check History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {checks.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No AML checks performed yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Use the address checker above to analyze wallet addresses
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-dex-secondary/30">
                    <TableHead className="text-gray-300">Date/Time</TableHead>
                    <TableHead className="text-gray-300">Chain</TableHead>
                    <TableHead className="text-gray-300">Address</TableHead>
                    <TableHead className="text-gray-300">Risk Level</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checks.map((check) => (
                    <TableRow key={check.id} className="border-dex-secondary/30">
                      <TableCell className="text-white">
                        {formatDate(check.created_at)}
                      </TableCell>
                      <TableCell className="text-white">
                        {NETWORK_CONFIG[check.chain]?.name || check.chain}
                      </TableCell>
                      <TableCell className="text-white font-mono">
                        {formatAddress(check.address)}
                      </TableCell>
                      <TableCell>
                        {getRiskBadge(check.risk_level)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(check.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(check)}
                            className="border-dex-secondary/30 text-white hover:bg-dex-secondary/20"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRecheck(check.id)}
                            disabled={recheckingId === check.id}
                            className="border-dex-secondary/30 text-white hover:bg-dex-secondary/20"
                          >
                            {recheckingId === check.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-400">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalChecks)} of {totalChecks} checks
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchHistory(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="border-dex-secondary/30 text-white hover:bg-dex-secondary/20"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchHistory(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="border-dex-secondary/30 text-white hover:bg-dex-secondary/20"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AMLHistory;
