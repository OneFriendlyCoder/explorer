import React from 'react';
import { useRouter } from 'next/router';
import { Transaction } from '@models/transaction.interface';
import { fetchTransaction } from '@store/transactions';
import { ReduxNextPageContext } from '@common/types/next-store';
import { useTransactionState } from '@common/hooks/use-transaction-state';
import { useMostRecentTxId } from '@common/hooks/use-most-recent-tx';
import { useRecentlyViewedTx } from '@common/hooks/use-recently-viewed-tx';
import { truncateMiddle } from '@common/utils';
import { useDispatch } from 'react-redux';
import { PageWrapper } from '@components/page';
import { Meta } from '@components/meta-head';
import CoinbasePage from '@components/tx/coinbase';
import TokenTransferPage from '@components/tx/token-transfer';
import SmartContractPage from '@components/tx/smart-contract';
import PoisonMicroblockPage from '@components/tx/poison-microblock';
import ContractCallPage from '@components/tx/contract-call';
import { TxNotFound } from '@components/tx/not-found';
import { getTxTypeName } from '@common/transaction-names';

const renderTxComponent = (transaction: Transaction) => {
  switch (transaction.tx_type) {
    case 'coinbase':
      return <CoinbasePage transaction={transaction} />;
    case 'token_transfer':
      return <TokenTransferPage transaction={transaction} />;
    case 'contract_call':
      return <ContractCallPage transaction={transaction} />;
    case 'smart_contract':
      return <SmartContractPage transaction={transaction} />;
    case 'poison_microblock':
      return <PoisonMicroblockPage transaction={transaction} />;
    default:
      throw new Error('Must pass valid transaction type');
  }
};

const TransactionMeta = ({ transaction }: any) => {
  const ogTitle = `${getTxTypeName(transaction.tx_type)}${
    transaction.tx_id && ` transaction: ${truncateMiddle(transaction.tx_id, 10)}`
  }`;
  const ogUrl = `/txid/${transaction.tx_id}`;
  const subject = transaction.sponsored ? 'Sponsored transaction' : 'Transaction';
  const ogDescription = `
    ${subject} initiated by ${transaction.sender_address}`;

  return (
    <Meta
      title={`${getTxTypeName(transaction.tx_type)} - Stacks 2.0 explorer`}
      ogTitle={ogTitle}
      description={ogDescription}
      url={ogUrl}
      status={transaction.tx_status}
      key={transaction.tx_status}
      labels={[{ label: 'Confirmation', data: `Block #${transaction.block_height}` }]}
    />
  );
};

const TransactionPage = ({ searchQuery }: { searchQuery: string }) => {
  const tx_id = useMostRecentTxId();
  const { transaction, error } = useTransactionState(tx_id as string);
  const router = useRouter();
  const dispatch = useDispatch();

  const handleRefresh = async () => dispatch(fetchTransaction(searchQuery));

  React.useEffect(() => {
    if (transaction) {
      if (searchQuery !== tx_id && router.pathname !== tx_id) {
        router.push('/txid/[txid]', `/txid/${tx_id}`, { shallow: true });
      }
    }
  }, [router.pathname, transaction]);

  useRecentlyViewedTx(transaction);

  if (error || !transaction)
    return (
      <PageWrapper>
        <TxNotFound refresh={handleRefresh} />
      </PageWrapper>
    );

  return (
    <PageWrapper>
      <TransactionMeta transaction={transaction} />
      {transaction && renderTxComponent(transaction)}
    </PageWrapper>
  );
};

TransactionPage.getInitialProps = async ({ store, query }: ReduxNextPageContext) => {
  const { txid } = query;
  if (txid) {
    await Promise.all([store.dispatch(fetchTransaction(txid.toString()))]);
    return { searchQuery: txid.toString() };
  }
  return {};
};

export default TransactionPage;