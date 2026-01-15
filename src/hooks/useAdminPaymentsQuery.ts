import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
type TransactionType = 'prize' | 'withdrawal' | 'bonus';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  payment_method: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  user_id: string;
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
  payment_details: {
    upi_id: string | null;
    bank_account_number: string | null;
    bank_ifsc: string | null;
  } | null;
  campaign: {
    title: string;
  } | null;
}

async function fetchTransactions(statusFilter: string): Promise<Transaction[]> {
  let query = supabase
    .from('wallet_transactions')
    .select(`
      id,
      type,
      amount,
      currency,
      status,
      payment_method,
      payment_reference,
      notes,
      created_at,
      user_id,
      profile:profiles!wallet_transactions_user_id_profiles_fkey(id, full_name, email),
      campaign:campaigns(title)
    `)
    .order('created_at', { ascending: false });

  if (statusFilter !== 'all' && ['pending', 'completed', 'failed', 'cancelled'].includes(statusFilter)) {
    query = query.eq('status', statusFilter as TransactionStatus);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Fetch payment details for each transaction
  const transactionsWithPayments = await Promise.all(
    (data || []).map(async (tx: any) => {
      const { data: paymentData } = await supabase
        .from('payment_details')
        .select('upi_id, bank_account_number, bank_ifsc')
        .eq('user_id', tx.user_id)
        .maybeSingle();
      
      return {
        ...tx,
        payment_details: paymentData,
      } as Transaction;
    })
  );

  return transactionsWithPayments;
}

export function useAdminPaymentsQuery(statusFilter: string) {
  return useQuery({
    queryKey: ['admin-payments', statusFilter],
    queryFn: () => fetchTransactions(statusFilter),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}
