import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type TransactionType = 'prize' | 'withdrawal' | 'bonus';
type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  notes: string | null;
  payment_reference: string | null;
  created_at: string;
  campaign: {
    title: string;
  } | null;
}

export interface WalletBalances {
  available: number;
  pending: number;
  totalEarned: number;
}

export const useWalletBalances = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['wallet-balances', userId],
    queryFn: async (): Promise<WalletBalances> => {
      if (!userId) {
        return { available: 0, pending: 0, totalEarned: 0 };
      }

      try {
        // Simply return default values - balances can be calculated from transactions if needed
        // This avoids RPC call timeouts
        const { data: transactions, error } = await supabase
          .from('wallet_transactions')
          .select('status, amount')
          .eq('user_id', userId);

        if (error) {
          console.error('Error fetching transactions for balance:', error);
          return { available: 0, pending: 0, totalEarned: 0 };
        }

        if (!transactions) return { available: 0, pending: 0, totalEarned: 0 };

        const available = transactions
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const pending = transactions
          .filter(t => t.status === 'pending')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const totalEarned = transactions
          .filter(t => t.status === 'completed' || t.status === 'pending')
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        return { available, pending, totalEarned };
      } catch (err) {
        console.error('Error fetching wallet balances:', err);
        return { available: 0, pending: 0, totalEarned: 0 };
      }
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};

export const useWalletTransactions = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['wallet-transactions', userId],
    queryFn: async (): Promise<Transaction[]> => {
      if (!userId) return [];

      try {
        const { data, error } = await supabase
          .from('wallet_transactions')
          .select(`
            id,
            type,
            amount,
            currency,
            status,
            notes,
            payment_reference,
            created_at,
            campaign:campaigns(title)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching wallet transactions:', error);
          return [];
        }
        return (data as unknown as Transaction[]) || [];
      } catch (err) {
        console.error('Error in wallet transactions query:', err);
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};
