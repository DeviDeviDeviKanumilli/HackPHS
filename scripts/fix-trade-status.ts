// Script to fix Trade enum before migration
import prisma from '../lib/db';

async function fixTradeStatus() {
  try {
    console.log('Updating Trade records with invalid status values...');
    
    // Update cancelled/accepted/declined to appropriate values
    // cancelled -> active (reactivate cancelled trades)
    // accepted -> pending (accepted trades should be pending)
    // declined -> this shouldn't exist in Trade, but handle it
    const cancelledResult = await prisma.$executeRawUnsafe(`
      UPDATE trades 
      SET status = 'active' 
      WHERE status = 'cancelled'
    `);
    
    const acceptedResult = await prisma.$executeRawUnsafe(`
      UPDATE trades 
      SET status = 'pending' 
      WHERE status = 'accepted'
    `);
    
    // declined shouldn't exist, but convert to active if it does
    const declinedResult = await prisma.$executeRawUnsafe(`
      UPDATE trades 
      SET status = 'active' 
      WHERE status = 'declined'
    `);
    
    console.log(`Updated ${cancelledResult} cancelled trades to active`);
    console.log(`Updated ${acceptedResult} accepted trades to pending`);
    console.log(`Updated ${declinedResult} declined trades to active`);
    console.log('✅ Trade status update complete');
  } catch (error) {
    console.error('Error updating Trade status:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixTradeStatus();

