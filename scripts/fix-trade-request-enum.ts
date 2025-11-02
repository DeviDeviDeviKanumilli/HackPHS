// Script to fix TradeRequest enum before migration
import prisma from '../lib/db';

async function fixTradeRequestStatus() {
  try {
    console.log('Updating TradeRequest records with invalid status values...');
    
    // Update accepted/declined to cancelled using raw SQL
    const result = await prisma.$executeRawUnsafe(`
      UPDATE trade_requests 
      SET status = 'cancelled' 
      WHERE status IN ('accepted', 'declined')
    `);
    
    console.log(`Updated ${result} TradeRequest records`);
    console.log('✅ TradeRequest status update complete');
  } catch (error) {
    console.error('Error updating TradeRequest status:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixTradeRequestStatus();

