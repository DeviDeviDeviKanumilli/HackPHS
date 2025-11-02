'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, Droplet, Sun, Thermometer, Bug, Scissors, Lightbulb, BookOpen, Handshake } from 'lucide-react';

interface Tip {
  id: string;
  category: string;
  title: string;
  content: string;
  icon: React.ReactNode;
}

const tips: Tip[] = [
  // Watering Tips
  {
    id: '1',
    category: 'watering',
    title: 'Check Soil Before Watering',
    content: 'Always check the soil moisture before watering. Stick your finger 1-2 inches into the soil. If it feels dry, it\'s time to water. Overwatering is one of the most common causes of plant death.',
    icon: <Droplet className="w-6 h-6" />,
  },
  {
    id: '2',
    category: 'watering',
    title: 'Water Deeply, Not Frequently',
    content: 'Water your plants thoroughly until water drains from the bottom, then let the soil dry out before watering again. This encourages deep root growth and prevents root rot.',
    icon: <Droplet className="w-6 h-6" />,
  },
  {
    id: '3',
    category: 'watering',
    title: 'Use Room Temperature Water',
    content: 'Cold water can shock plant roots. Let tap water sit for 24 hours to allow chlorine to evaporate, or use filtered water for sensitive plants.',
    icon: <Droplet className="w-6 h-6" />,
  },
  {
    id: '4',
    category: 'watering',
    title: 'Water in the Morning',
    content: 'Watering in the morning allows plants to absorb moisture before the heat of the day. Avoid watering at night as it can promote fungal growth.',
    icon: <Droplet className="w-6 h-6" />,
  },
  {
    id: '4a',
    category: 'watering',
    title: 'Use Bottom Watering for Some Plants',
    content: 'Plants like African violets and some succulents prefer bottom watering. Place the pot in a tray of water and let it soak up moisture through the drainage holes for 30 minutes.',
    icon: <Droplet className="w-6 h-6" />,
  },
  {
    id: '4b',
    category: 'watering',
    title: 'Adjust Watering for Seasons',
    content: 'Plants need less water in winter when growth slows. Increase watering frequency in spring and summer when plants are actively growing. Always check soil moisture first.',
    icon: <Droplet className="w-6 h-6" />,
  },
  {
    id: '4c',
    category: 'watering',
    title: 'Know Your Plant\'s Water Needs',
    content: 'Succulents and cacti need infrequent watering, while tropical plants prefer consistently moist soil. Research your specific plant\'s preferences rather than watering on a fixed schedule.',
    icon: <Droplet className="w-6 h-6" />,
  },
  {
    id: '4d',
    category: 'watering',
    title: 'Empty Saucers After Watering',
    content: 'Don\'t let plants sit in standing water. Empty saucers 30 minutes after watering to prevent root rot and pest issues. Standing water attracts fungus gnats.',
    icon: <Droplet className="w-6 h-6" />,
  },
  
  // Light Tips
  {
    id: '5',
    category: 'light',
    title: 'Understand Light Requirements',
    content: 'Low light doesn\'t mean no light. Most "low light" plants need bright, indirect light. Direct sunlight can burn leaves, while too little light causes leggy growth.',
    icon: <Sun className="w-6 h-6" />,
  },
  {
    id: '6',
    category: 'light',
    title: 'Rotate Your Plants',
    content: 'Rotate your plants weekly to ensure even growth. Plants naturally grow toward light sources, so rotating prevents them from leaning to one side.',
    icon: <Sun className="w-6 h-6" />,
  },
  {
    id: '7',
    category: 'light',
    title: 'Monitor Light Throughout Seasons',
    content: 'Light conditions change with seasons. Move plants closer to windows in winter and further away in summer to maintain consistent light levels.',
    icon: <Sun className="w-6 h-6" />,
  },
  {
    id: '7a',
    category: 'light',
    title: 'Use Grow Lights for Low Light Areas',
    content: 'If you don\'t have enough natural light, LED grow lights are an excellent supplement. Use them for 12-16 hours daily, positioned 6-12 inches above plants.',
    icon: <Sun className="w-6 h-6" />,
  },
  {
    id: '7b',
    category: 'light',
    title: 'Watch for Sunburn Signs',
    content: 'Brown or white spots on leaves indicate sunburn. Move the plant away from direct sunlight immediately. Some plants can recover, but prevention is key.',
    icon: <Sun className="w-6 h-6" />,
  },
  {
    id: '7c',
    category: 'light',
    title: 'East-Facing Windows Are Ideal',
    content: 'East-facing windows provide gentle morning sun that\'s perfect for most houseplants. They offer bright indirect light without the intensity of afternoon sun.',
    icon: <Sun className="w-6 h-6" />,
  },
  {
    id: '7d',
    category: 'light',
    title: 'Use Sheer Curtains for Filtered Light',
    content: 'If your windows get intense direct sunlight, use sheer curtains to filter the light. This creates ideal conditions for plants that need bright indirect light.',
    icon: <Sun className="w-6 h-6" />,
  },
  
  // Temperature & Environment
  {
    id: '8',
    category: 'environment',
    title: 'Avoid Drafts and Vents',
    content: 'Keep plants away from heating vents, air conditioners, and drafty windows. Sudden temperature changes stress plants and can cause leaf drop.',
    icon: <Thermometer className="w-6 h-6" />,
  },
  {
    id: '9',
    category: 'environment',
    title: 'Increase Humidity for Tropical Plants',
    content: 'Group plants together, use a pebble tray with water, or mist plants regularly to increase humidity. Most houseplants prefer 40-60% humidity.',
    icon: <Thermometer className="w-6 h-6" />,
  },
  {
    id: '10',
    category: 'environment',
    title: 'Clean Leaves Regularly',
    content: 'Dust on leaves blocks sunlight and reduces photosynthesis. Wipe leaves with a damp cloth or give plants a gentle shower monthly to keep them healthy.',
    icon: <Sprout className="w-6 h-6" />,
  },
  {
    id: '10a',
    category: 'environment',
    title: 'Maintain Consistent Temperature',
    content: 'Most houseplants prefer temperatures between 65-75°F (18-24°C). Avoid placing plants near doors or windows that cause temperature fluctuations.',
    icon: <Thermometer className="w-6 h-6" />,
  },
  {
    id: '10b',
    category: 'environment',
    title: 'Use a Humidifier in Dry Climates',
    content: 'If your home has low humidity (below 40%), use a humidifier near your plants. This is especially important for tropical plants during winter when heaters dry the air.',
    icon: <Thermometer className="w-6 h-6" />,
  },
  {
    id: '10c',
    category: 'environment',
    title: 'Group Plants Together',
    content: 'Grouping plants creates a microclimate with higher humidity. Plants release moisture through transpiration, benefiting each other when grouped together.',
    icon: <Sprout className="w-6 h-6" />,
  },
  {
    id: '10d',
    category: 'environment',
    title: 'Provide Good Air Circulation',
    content: 'While avoiding drafts, ensure plants have good air circulation. Stagnant air can lead to fungal diseases. A gentle fan on low can help circulate air.',
    icon: <Thermometer className="w-6 h-6" />,
  },
  
  // Pruning & Maintenance
  {
    id: '11',
    category: 'pruning',
    title: 'Prune Dead or Yellow Leaves',
    content: 'Remove dead, yellow, or damaged leaves regularly. This helps prevent disease and encourages new growth. Use clean, sharp scissors or pruning shears.',
    icon: <Scissors className="w-6 h-6" />,
  },
  {
    id: '12',
    category: 'pruning',
    title: 'Pinch Back for Bushier Growth',
    content: 'Pinch or cut back the tips of stems to encourage branching and create a fuller, bushier plant. This works especially well for herbs and flowering plants.',
    icon: <Scissors className="w-6 h-6" />,
  },
  {
    id: '13',
    category: 'pruning',
    title: 'Prune After Flowering',
    content: 'For flowering plants, prune immediately after blooms fade. This redirects energy to new growth and potentially more flowers rather than seed production.',
    icon: <Scissors className="w-6 h-6" />,
  },
  {
    id: '13a',
    category: 'pruning',
    title: 'Sterilize Pruning Tools',
    content: 'Always clean pruning tools with rubbing alcohol before and after use. This prevents spreading diseases between plants. Dirty tools can introduce harmful bacteria.',
    icon: <Scissors className="w-6 h-6" />,
  },
  {
    id: '13b',
    category: 'pruning',
    title: 'Prune to Control Size',
    content: 'Regular pruning helps control plant size and shape. For vining plants, cut back long stems to encourage bushier growth and prevent legginess.',
    icon: <Scissors className="w-6 h-6" />,
  },
  {
    id: '13c',
    category: 'pruning',
    title: 'Cut Above Leaf Nodes',
    content: 'When pruning stems, cut just above a leaf node (where leaves attach). This encourages new growth from that point and creates a cleaner appearance.',
    icon: <Scissors className="w-6 h-6" />,
  },
  {
    id: '13d',
    category: 'pruning',
    title: 'Remove Spent Flowers',
    content: 'Deadhead (remove) spent flowers to encourage more blooms. This prevents plants from putting energy into seed production and extends the flowering period.',
    icon: <Scissors className="w-6 h-6" />,
  },
  
  // Pest Control
  {
    id: '14',
    category: 'pests',
    title: 'Inspect Plants Regularly',
    content: 'Check plants weekly for pests like aphids, spider mites, or mealybugs. Early detection makes treatment much easier. Look under leaves and along stems.',
    icon: <Bug className="w-6 h-6" />,
  },
  {
    id: '15',
    category: 'pests',
    title: 'Isolate Infested Plants',
    content: 'If you find pests, immediately isolate the affected plant to prevent spreading. Treat with insecticidal soap or neem oil, and keep isolated until pests are gone.',
    icon: <Bug className="w-6 h-6" />,
  },
  {
    id: '16',
    category: 'pests',
    title: 'Use Natural Pest Control',
    content: 'Neem oil, insecticidal soap, and diatomaceous earth are effective natural pest control options. Avoid harsh chemicals that can harm beneficial insects and your plants.',
    icon: <Bug className="w-6 h-6" />,
  },
  {
    id: '16a',
    category: 'pests',
    title: 'Identify Common Houseplant Pests',
    content: 'Learn to identify common pests: spider mites (tiny webs), mealybugs (white cottony masses), scale (brown bumps), aphids (small green/black bugs), and thrips (silvery damage).',
    icon: <Bug className="w-6 h-6" />,
  },
  {
    id: '16b',
    category: 'pests',
    title: 'Quarantine New Plants',
    content: 'Always quarantine new plants for 2-3 weeks before adding them to your collection. This prevents introducing pests to your existing plants. Inspect thoroughly during this period.',
    icon: <Bug className="w-6 h-6" />,
  },
  {
    id: '16c',
    category: 'pests',
    title: 'Use Rubbing Alcohol for Mealybugs',
    content: 'Dab mealybugs with a cotton swab soaked in rubbing alcohol. This kills them on contact. Follow up with neem oil spray to prevent reinfestation.',
    icon: <Bug className="w-6 h-6" />,
  },
  {
    id: '16d',
    category: 'pests',
    title: 'Wash Plants Regularly',
    content: 'Give plants a gentle shower or wipe leaves with a damp cloth regularly. This removes dust and can dislodge small pests before they become a major problem.',
    icon: <Bug className="w-6 h-6" />,
  },
  
  // Fertilizing
  {
    id: '17',
    category: 'fertilizing',
    title: 'Fertilize During Growing Season',
    content: 'Most plants benefit from fertilizing during spring and summer (growing season). Reduce or stop fertilizing in fall and winter when plants are dormant.',
    icon: <Sprout className="w-6 h-6" />,
  },
  {
    id: '18',
    category: 'fertilizing',
    title: 'Less is More',
    content: 'It\'s better to under-fertilize than over-fertilize. Too much fertilizer can burn roots and cause leaf damage. Follow package instructions and dilute if unsure.',
    icon: <Sprout className="w-6 h-6" />,
  },
  {
    id: '19',
    category: 'fertilizing',
    title: 'Choose the Right Fertilizer',
    content: 'Use balanced fertilizer (10-10-10) for most houseplants. Flowering plants may need higher phosphorus, while foliage plants benefit from higher nitrogen.',
    icon: <Sprout className="w-6 h-6" />,
  },
  {
    id: '19a',
    category: 'fertilizing',
    title: 'Water Before Fertilizing',
    content: 'Always water plants before applying fertilizer. Fertilizing dry soil can burn roots. Water first, wait 30 minutes, then apply fertilizer solution.',
    icon: <Sprout className="w-6 h-6" />,
  },
  {
    id: '19b',
    category: 'fertilizing',
    title: 'Use Liquid Fertilizer for Better Control',
    content: 'Liquid fertilizers are easier to control and apply evenly. Dilute according to package instructions and apply every 2-4 weeks during growing season.',
    icon: <Sprout className="w-6 h-6" />,
  },
  {
    id: '19c',
    category: 'fertilizing',
    title: 'Skip Fertilizing Newly Repotted Plants',
    content: 'Don\'t fertilize plants for 4-6 weeks after repotting. Fresh potting mix contains nutrients, and roots need time to establish before additional feeding.',
    icon: <Sprout className="w-6 h-6" />,
  },
  {
    id: '19d',
    category: 'fertilizing',
    title: 'Watch for Fertilizer Burn',
    content: 'Yellow or brown leaf tips can indicate fertilizer burn. If this occurs, flush the soil with water to remove excess fertilizer and reduce future applications.',
    icon: <Sprout className="w-6 h-6" />,
  },
  
  // Repotting
  {
    id: '20',
    category: 'repotting',
    title: 'Know When to Repot',
    content: 'Repot when roots are circling the pot, soil dries out quickly, or the plant is top-heavy. Most plants need repotting every 1-2 years, but some prefer being root-bound.',
    icon: <Sprout className="w-6 h-6" />,
  },
  {
    id: '21',
    category: 'repotting',
    title: 'Choose the Right Pot Size',
    content: 'Only go up one pot size (1-2 inches larger). Too large a pot holds excess water and can cause root rot. Ensure the new pot has drainage holes.',
    icon: <Sprout className="w-6 h-6" />,
  },
  {
    id: '22',
    category: 'repotting',
    title: 'Use Fresh Potting Mix',
    content: 'Use fresh, well-draining potting mix when repotting. Don\'t reuse old soil as it may contain pests or diseases. Mix in perlite or sand for better drainage if needed.',
    icon: <Sprout className="w-6 h-6" />,
  },
  {
    id: '22a',
    category: 'repotting',
    title: 'Water After Repotting',
    content: 'Water thoroughly after repotting to help settle the soil and remove air pockets. Then wait a few days before watering again to let roots adjust.',
    icon: <Sprout className="w-6 h-6" />,
  },
  {
    id: '22b',
    category: 'repotting',
    title: 'Loosen Root Ball Gently',
    content: 'When repotting, gently loosen the root ball to encourage new root growth. Don\'t be too aggressive - only loosen the outer roots if they\'re tightly bound.',
    icon: <Sprout className="w-6 h-6" />,
  },
  {
    id: '22c',
    category: 'repotting',
    title: 'Repot During Growing Season',
    content: 'Spring and early summer are the best times to repot. Plants are actively growing and can recover quickly from the stress of repotting.',
    icon: <Sprout className="w-6 h-6" />,
  },
  {
    id: '22d',
    category: 'repotting',
    title: 'Some Plants Prefer Being Root-Bound',
    content: 'Plants like peace lilies, spider plants, and some succulents actually prefer being slightly root-bound. Don\'t repot these unless they\'re severely cramped.',
    icon: <Sprout className="w-6 h-6" />,
  },
  
  // General Tips
  {
    id: '23',
    category: 'general',
    title: 'Research Your Plant',
    content: 'Each plant has unique needs. Research your specific plant\'s requirements for light, water, humidity, and temperature to ensure success.',
    icon: <BookOpen className="w-6 h-6" />,
  },
  {
    id: '24',
    category: 'general',
    title: 'Start with Easy Plants',
    content: 'If you\'re new to plant care, start with low-maintenance plants like snake plants, pothos, or ZZ plants. They\'re forgiving and great for building confidence.',
    icon: <Lightbulb className="w-6 h-6" />,
  },
  {
    id: '25',
    category: 'general',
    title: 'Keep a Plant Journal',
    content: 'Track watering schedules, fertilization dates, and any issues you notice. This helps you learn what works for your plants and environment.',
    icon: <BookOpen className="w-6 h-6" />,
  },
  {
    id: '26',
    category: 'general',
    title: 'Don\'t Overthink It',
    content: 'Plants are resilient! While they need care, don\'t stress about perfection. Observe your plants and adjust care based on how they respond. Plants will tell you what they need.',
    icon: <Lightbulb className="w-6 h-6" />,
  },
  {
    id: '26a',
    category: 'general',
    title: 'Learn to Read Plant Signals',
    content: 'Yellow leaves often mean overwatering, brown crispy edges indicate underwatering or low humidity, leggy growth means insufficient light. Learn these signs to diagnose issues quickly.',
    icon: <Lightbulb className="w-6 h-6" />,
  },
  {
    id: '26b',
    category: 'general',
    title: 'Be Patient with New Plants',
    content: 'New plants need time to adjust to their new environment. Don\'t be alarmed if leaves drop or growth slows initially. Give them 2-4 weeks to acclimate before making major changes.',
    icon: <BookOpen className="w-6 h-6" />,
  },
  {
    id: '26c',
    category: 'general',
    title: 'Don\'t Move Plants Frequently',
    content: 'Plants need stability. Constantly moving them between locations stresses them. Once you find a good spot, let them stay there unless they show signs of distress.',
    icon: <Lightbulb className="w-6 h-6" />,
  },
  {
    id: '26d',
    category: 'general',
    title: 'Use a Moisture Meter',
    content: 'A soil moisture meter takes the guesswork out of watering. Insert it into the soil to get an accurate reading of moisture levels, especially helpful for beginners.',
    icon: <BookOpen className="w-6 h-6" />,
  },
  {
    id: '26e',
    category: 'general',
    title: 'Propagate Your Favorite Plants',
    content: 'Learn to propagate plants from cuttings or division. It\'s rewarding, cost-effective, and allows you to share plants with friends. Many plants root easily in water or soil.',
    icon: <Sprout className="w-6 h-6" />,
  },
  {
    id: '26f',
    category: 'general',
    title: 'Choose Plants for Your Lifestyle',
    content: 'If you travel frequently, choose low-maintenance plants like snake plants or ZZ plants. If you\'re home often, you can care for more demanding tropical plants.',
    icon: <Lightbulb className="w-6 h-6" />,
  },
  {
    id: '26g',
    category: 'general',
    title: 'Join Plant Communities',
    content: 'Connect with other plant enthusiasts online or locally. Sharing experiences, getting advice, and seeing others\' successes can be motivating and educational.',
    icon: <BookOpen className="w-6 h-6" />,
  },
  {
    id: '26h',
    category: 'general',
    title: 'Celebrate Small Wins',
    content: 'Notice new leaves, successful propagation, or solving a plant problem. Celebrating these small victories makes plant care more enjoyable and rewarding.',
    icon: <Lightbulb className="w-6 h-6" />,
  },
  
  // Trading Tips
  {
    id: '27',
    category: 'trading',
    title: 'Inspect Plants Before Trading',
    content: 'Always thoroughly inspect plants before trading. Check for pests, diseases, root health, and overall condition. Healthy plants make for successful trades and happy trading partners.',
    icon: <Handshake className="w-6 h-6" />,
  },
  {
    id: '28',
    category: 'trading',
    title: 'Quarantine New Plants After Trading',
    content: 'Quarantine newly traded plants for 2-3 weeks before adding them to your collection. This prevents introducing pests or diseases to your existing plants.',
    icon: <Handshake className="w-6 h-6" />,
  },
  {
    id: '29',
    category: 'trading',
    title: 'Package Plants Carefully',
    content: 'When shipping plants, wrap roots in damp paper towel and secure in a plastic bag. Protect leaves with newspaper or bubble wrap. Label packages as "Live Plants" and ship quickly.',
    icon: <Handshake className="w-6 h-6" />,
  },
  {
    id: '30',
    category: 'trading',
    title: 'Be Honest About Plant Condition',
    content: 'Always be transparent about your plant\'s condition, including any issues or special care requirements. Honesty builds trust and leads to better trading relationships.',
    icon: <Handshake className="w-6 h-6" />,
  },
  {
    id: '31',
    category: 'trading',
    title: 'Take Clear Photos',
    content: 'Take multiple clear photos showing the full plant, leaves, and roots (if bare-root). Good photos help traders make informed decisions and avoid misunderstandings.',
    icon: <Handshake className="w-6 h-6" />,
  },
  {
    id: '32',
    category: 'trading',
    title: 'Trade in Similar Sizes',
    content: 'When trading, try to match plant sizes and values. A large established plant usually trades for another large plant, while cuttings trade for cuttings.',
    icon: <Handshake className="w-6 h-6" />,
  },
  {
    id: '33',
    category: 'trading',
    title: 'Include Care Instructions',
    content: 'Provide care instructions with traded plants, especially for rare or finicky species. This helps the new owner succeed and shows you care about the plant\'s wellbeing.',
    icon: <Handshake className="w-6 h-6" />,
  },
  {
    id: '34',
    category: 'trading',
    title: 'Trade Locally When Possible',
    content: 'Local trades reduce shipping stress on plants and are more environmentally friendly. Use plant trading groups or apps to find local plant enthusiasts.',
    icon: <Handshake className="w-6 h-6" />,
  },
  {
    id: '35',
    category: 'trading',
    title: 'Propagate Before Trading',
    content: 'Always keep a cutting or division of plants you\'re trading. This way, if the trade doesn\'t work out or you miss the plant, you still have it in your collection.',
    icon: <Handshake className="w-6 h-6" />,
  },
  {
    id: '36',
    category: 'trading',
    title: 'Communicate Clearly',
    content: 'Maintain clear communication with trading partners. Discuss expectations, shipping methods, and timelines upfront to avoid misunderstandings and ensure smooth trades.',
    icon: <Handshake className="w-6 h-6" />,
  },
  {
    id: '37',
    category: 'trading',
    title: 'Start with Common Plants',
    content: 'If you\'re new to trading, start with common, easy-to-grow plants. Build your reputation and experience before trading rare or expensive specimens.',
    icon: <Handshake className="w-6 h-6" />,
  },
  {
    id: '38',
    category: 'trading',
    title: 'Research Plant Values',
    content: 'Research plant values before trading to ensure fair exchanges. Consider size, rarity, health, and current market prices. Online plant communities can help with valuations.',
    icon: <Handshake className="w-6 h-6" />,
  },
  
  // More Watering Tips
  {
    id: '39',
    category: 'watering',
    title: 'Different Plants Need Different Approaches',
    content: 'Succulents prefer the "soak and dry" method, while ferns need consistent moisture. Research your specific plant\'s watering needs rather than using a one-size-fits-all approach.',
    icon: <Droplet className="w-6 h-6" />,
  },
  {
    id: '40',
    category: 'watering',
    title: 'Water Quality Matters',
    content: 'Some plants are sensitive to chemicals in tap water. If you notice leaf browning, try using filtered, distilled, or rainwater for sensitive plants like calatheas and carnivorous plants.',
    icon: <Droplet className="w-6 h-6" />,
  },
  {
    id: '41',
    category: 'watering',
    title: 'Self-Watering Pots Can Help',
    content: 'Self-watering pots with reservoirs can help maintain consistent moisture for plants that need it. Great for when you\'re away or have inconsistent watering schedules.',
    icon: <Droplet className="w-6 h-6" />,
  },
  {
    id: '42',
    category: 'watering',
    title: 'Check Weight of Pot',
    content: 'Learn to judge soil moisture by pot weight. Dry soil feels light, while wet soil is heavy. This is especially useful for large plants where finger testing is difficult.',
    icon: <Droplet className="w-6 h-6" />,
  },
  
  // More Light Tips
  {
    id: '43',
    category: 'light',
    title: 'North Windows for Low Light Plants',
    content: 'North-facing windows provide consistent, gentle light perfect for low-light plants like pothos, snake plants, and ZZ plants. These rarely get direct sun.',
    icon: <Sun className="w-6 h-6" />,
  },
  {
    id: '44',
    category: 'light',
    title: 'South Windows Need Filtering',
    content: 'South-facing windows get intense direct sunlight. Most houseplants need protection from this harsh light. Use sheer curtains or place plants a few feet away from the window.',
    icon: <Sun className="w-6 h-6" />,
  },
  {
    id: '45',
    category: 'light',
    title: 'Watch for Leggy Growth',
    content: 'If plants become leggy with long spaces between leaves, they need more light. Move them closer to a window or add supplemental grow lights.',
    icon: <Sun className="w-6 h-6" />,
  },
  {
    id: '46',
    category: 'light',
    title: 'Artificial Light Duration',
    content: 'When using grow lights, most plants need 12-16 hours of light per day. Use a timer to ensure consistent lighting schedules and give plants rest periods.',
    icon: <Sun className="w-6 h-6" />,
  },
  
  // More Environment Tips
  {
    id: '47',
    category: 'environment',
    title: 'Use Pebble Trays for Humidity',
    content: 'Place a layer of pebbles in a tray, add water below the pebbles, and set plants on top. As water evaporates, it increases humidity around the plants without waterlogging roots.',
    icon: <Thermometer className="w-6 h-6" />,
  },
  {
    id: '48',
    category: 'environment',
    title: 'Avoid Rapid Temperature Changes',
    content: 'Plants don\'t like sudden temperature swings. Avoid placing them near doors that open frequently, heating vents, or air conditioning units that create dramatic temperature shifts.',
    icon: <Thermometer className="w-6 h-6" />,
  },
  {
    id: '49',
    category: 'environment',
    title: 'Mist Selectively',
    content: 'Misting can help with humidity, but do it in the morning so leaves dry before night. Avoid misting plants with fuzzy leaves (like African violets) as water can cause damage.',
    icon: <Thermometer className="w-6 h-6" />,
  },
  {
    id: '50',
    category: 'environment',
    title: 'Bathroom Plants Love Humidity',
    content: 'Bathrooms with windows are perfect for humidity-loving plants like ferns, calatheas, and orchids. The steam from showers creates an ideal microclimate.',
    icon: <Thermometer className="w-6 h-6" />,
  },
  
  // More Pruning Tips
  {
    id: '51',
    category: 'pruning',
    title: 'Prune During Active Growth',
    content: 'The best time to prune is during spring and summer when plants are actively growing. They recover faster and produce new growth more quickly during this period.',
    icon: <Scissors className="w-6 h-6" />,
  },
  {
    id: '52',
    category: 'pruning',
    title: 'Remove Yellow Leaves Promptly',
    content: 'Yellow leaves won\'t turn green again. Remove them promptly to prevent the plant from wasting energy on dying tissue and to improve appearance.',
    icon: <Scissors className="w-6 h-6" />,
  },
  {
    id: '53',
    category: 'pruning',
    title: 'Prune for Shape and Structure',
    content: 'Regular pruning helps maintain plant shape and encourages strong branching. Remove weak or crossing branches to improve air circulation and plant structure.',
    icon: <Scissors className="w-6 h-6" />,
  },
  {
    id: '54',
    category: 'pruning',
    title: 'Use Sharp Tools',
    content: 'Sharp pruning tools make clean cuts that heal faster. Dull tools can crush stems and create ragged cuts that are more susceptible to disease.',
    icon: <Scissors className="w-6 h-6" />,
  },
  
  // More Pest Control Tips
  {
    id: '55',
    category: 'pests',
    title: 'Prevent Pests with Good Care',
    content: 'Healthy plants are less susceptible to pests. Proper watering, adequate light, and good air circulation create conditions that discourage pest infestations.',
    icon: <Bug className="w-6 h-6" />,
  },
  {
    id: '56',
    category: 'pests',
    title: 'Treat Immediately When Found',
    content: 'Don\'t wait to treat pests. They multiply quickly. Isolate the plant immediately and begin treatment as soon as you notice any signs of infestation.',
    icon: <Bug className="w-6 h-6" />,
  },
  {
    id: '57',
    category: 'pests',
    title: 'Check Undersides of Leaves',
    content: 'Many pests hide on the undersides of leaves. Always flip leaves over when inspecting plants. Spider mites and aphids especially prefer leaf undersides.',
    icon: <Bug className="w-6 h-6" />,
  },
  {
    id: '58',
    category: 'pests',
    title: 'Use Yellow Sticky Traps',
    content: 'Yellow sticky traps help catch flying pests like fungus gnats and whiteflies. Place them near affected plants to monitor and reduce pest populations.',
    icon: <Bug className="w-6 h-6" />,
  },
  
  // More Fertilizing Tips
  {
    id: '59',
    category: 'fertilizing',
    title: 'Dilute More Than Recommended',
    content: 'When in doubt, dilute fertilizer more than package instructions suggest. Most houseplants are sensitive to fertilizer, and weaker solutions prevent burning.',
    icon: <Sprout className="w-6 h-6" />,
  },
  {
    id: '60',
    category: 'fertilizing',
    title: 'Organic vs Synthetic Fertilizers',
    content: 'Organic fertilizers release nutrients slowly and improve soil health. Synthetic fertilizers work faster but can build up salts. Many gardeners prefer organic for houseplants.',
    icon: <Sprout className="w-6 h-6" />,
  },
  {
    id: '61',
    category: 'fertilizing',
    title: 'Fertilize After Watering',
    content: 'Always apply fertilizer to moist soil, never dry. Water first, wait 30 minutes, then fertilize. This prevents root burn and ensures even distribution.',
    icon: <Sprout className="w-6 h-6" />,
  },
  {
    id: '62',
    category: 'fertilizing',
    title: 'Stop Fertilizing Sick Plants',
    content: 'Don\'t fertilize plants that are stressed, diseased, or recently repotted. Let them recover first. Fertilizer can further stress struggling plants.',
    icon: <Sprout className="w-6 h-6" />,
  },
  
  // More Repotting Tips
  {
    id: '63',
    category: 'repotting',
    title: 'Wait for Right Signs',
    content: 'Don\'t repot just because a plant seems small. Wait for clear signs like roots growing through drainage holes, soil drying very quickly, or the plant becoming root-bound.',
    icon: <Sprout className="w-6 h-6" />,
  },
  {
    id: '64',
    category: 'repotting',
    title: 'Choose Terracotta for Better Drainage',
    content: 'Terracotta pots are porous and allow soil to dry more evenly. Great for plants prone to overwatering. Plastic pots retain moisture longer, better for thirsty plants.',
    icon: <Sprout className="w-6 h-6" />,
  },
  {
    id: '65',
    category: 'repotting',
    title: 'Add Drainage Layer',
    content: 'Add a layer of gravel or broken pottery pieces at the bottom of pots before adding soil. This improves drainage and prevents soil from blocking drainage holes.',
    icon: <Sprout className="w-6 h-6" />,
  },
  {
    id: '66',
    category: 'repotting',
    title: 'Don\'t Bury Stem Too Deep',
    content: 'When repotting, keep the plant at the same soil level as before. Burying stems too deep can cause rot. Some plants like to be slightly elevated above soil level.',
    icon: <Sprout className="w-6 h-6" />,
  },
  
  // More General Tips
  {
    id: '67',
    category: 'general',
    title: 'Learn Your Hardiness Zone',
    content: 'Understanding your hardiness zone helps choose appropriate outdoor plants. For indoor plants, focus on replicating their native climate conditions.',
    icon: <BookOpen className="w-6 h-6" />,
  },
  {
    id: '68',
    category: 'general',
    title: 'Create a Plant Care Schedule',
    content: 'Develop a weekly routine: check plants Sunday, water Monday/Wednesday/Friday, fertilize bi-weekly. Consistency helps you remember care tasks and keeps plants healthy.',
    icon: <Lightbulb className="w-6 h-6" />,
  },
  {
    id: '69',
    category: 'general',
    title: 'Don\'t Panic Over Leaf Drop',
    content: 'Some leaf drop is normal, especially when plants adjust to new environments or seasons. Only worry if it\'s excessive or combined with other symptoms.',
    icon: <Lightbulb className="w-6 h-6" />,
  },
  {
    id: '70',
    category: 'general',
    title: 'Plants Can Recover',
    content: 'Most plants are resilient and can recover from various issues. Don\'t give up on a struggling plant too quickly. Often, adjusting one care factor makes all the difference.',
    icon: <Lightbulb className="w-6 h-6" />,
  },
  {
    id: '71',
    category: 'general',
    title: 'Keep Records of What Works',
    content: 'Document successful care routines, what fertilizers work best, and which locations suit each plant. This builds your knowledge and helps you succeed with new plants.',
    icon: <BookOpen className="w-6 h-6" />,
  },
  {
    id: '72',
    category: 'general',
    title: 'Enjoy the Process',
    content: 'Plant care is a journey, not a destination. Enjoy learning, experimenting, and watching your plants grow. The hobby should bring joy, not stress.',
    icon: <Lightbulb className="w-6 h-6" />,
  },
  
  // Even More Tips
  {
    id: '73',
    category: 'trading',
    title: 'Ship During Cooler Months',
    content: 'If shipping plants, try to do so during spring or fall when temperatures are moderate. Avoid extreme heat or cold that can damage plants during transit.',
    icon: <Handshake className="w-6 h-6" />,
  },
  {
    id: '74',
    category: 'trading',
    title: 'Build Reputation Gradually',
    content: 'Start with small trades and build your reputation in the trading community. Positive reviews and successful trades lead to better trading opportunities.',
    icon: <Handshake className="w-6 h-6" />,
  },
  {
    id: '75',
    category: 'trading',
    title: 'Document Trades',
    content: 'Keep records of your trades including photos, dates, and outcomes. This helps you learn what works and provides reference if issues arise.',
    icon: <Handshake className="w-6 h-6" />,
  },
  {
    id: '76',
    category: 'watering',
    title: 'Use Chopstick Test',
    content: 'Insert a wooden chopstick into the soil. If it comes out clean, the soil is dry. If soil sticks to it, there\'s still moisture. This is more accurate than finger testing.',
    icon: <Droplet className="w-6 h-6" />,
  },
  {
    id: '77',
    category: 'watering',
    title: 'Consider Plant Size',
    content: 'Larger plants generally need more water, but also check more frequently. Small plants in small pots dry out faster and may need more frequent watering.',
    icon: <Droplet className="w-6 h-6" />,
  },
  {
    id: '78',
    category: 'light',
    title: 'West Windows Get Afternoon Sun',
    content: 'West-facing windows receive intense afternoon sun. Great for cacti and succulents, but most houseplants need protection with sheer curtains or distance.',
    icon: <Sun className="w-6 h-6" />,
  },
  {
    id: '79',
    category: 'light',
    title: 'Supplement Natural Light',
    content: 'Even bright rooms may not have enough light for some plants. Use grow lights to supplement natural light, especially during winter months.',
    icon: <Sun className="w-6 h-6" />,
  },
  {
    id: '80',
    category: 'environment',
    title: 'Avoid Placement Near Electronics',
    content: 'Keep plants away from electronics that emit heat like TVs, computers, or routers. The heat can dry out plants and create unfavorable conditions.',
    icon: <Thermometer className="w-6 h-6" />,
  },
  {
    id: '81',
    category: 'environment',
    title: 'Monitor Temperature at Night',
    content: 'Some plants need cooler nighttime temperatures to thrive. Research your plant\'s specific needs, as some prefer 10-15°F cooler at night.',
    icon: <Thermometer className="w-6 h-6" />,
  },
  {
    id: '82',
    category: 'pruning',
    title: 'Save Cuttings for Propagation',
    content: 'Don\'t throw away healthy cuttings from pruning. Many can be rooted in water or soil to create new plants. This is especially true for vining plants.',
    icon: <Scissors className="w-6 h-6" />,
  },
  {
    id: '83',
    category: 'pruning',
    title: 'Prune to Encourage Flowering',
    content: 'For flowering plants, strategic pruning can encourage more blooms. Remove old flowers and trim back to promote new growth that will flower.',
    icon: <Scissors className="w-6 h-6" />,
  },
  {
    id: '84',
    category: 'pests',
    title: 'Use Systemic Treatments for Persistent Pests',
    content: 'For persistent pest problems, consider systemic treatments that plants absorb. These provide longer-lasting protection but should be used carefully.',
    icon: <Bug className="w-6 h-6" />,
  },
  {
    id: '85',
    category: 'pests',
    title: 'Encourage Beneficial Insects',
    content: 'For outdoor plants, encourage beneficial insects like ladybugs and lacewings that eat pests. Avoid broad-spectrum pesticides that kill beneficials too.',
    icon: <Bug className="w-6 h-6" />,
  },
  {
    id: '86',
    category: 'fertilizing',
    title: 'Use Slow-Release Fertilizers',
    content: 'Slow-release fertilizers provide nutrients over time, reducing the risk of over-fertilization. Great for busy plant parents who forget regular feeding.',
    icon: <Sprout className="w-6 h-6" />,
  },
  {
    id: '87',
    category: 'fertilizing',
    title: 'Fertilize Based on Growth',
    content: 'Fast-growing plants need more fertilizer than slow growers. Adjust fertilization frequency based on how actively your plant is growing.',
    icon: <Sprout className="w-6 h-6" />,
  },
  {
    id: '88',
    category: 'repotting',
    title: 'Handle Roots Gently',
    content: 'When repotting, handle roots as gently as possible. Damaged roots can stress the plant and slow recovery. Use your hands rather than tools when possible.',
    icon: <Sprout className="w-6 h-6" />,
  },
];

const categories = [
  { id: 'all', label: 'All Tips', icon: <BookOpen className="w-5 h-5" /> },
  { id: 'watering', label: 'Watering', icon: <Droplet className="w-5 h-5" /> },
  { id: 'light', label: 'Light', icon: <Sun className="w-5 h-5" /> },
  { id: 'environment', label: 'Environment', icon: <Thermometer className="w-5 h-5" /> },
  { id: 'pruning', label: 'Pruning', icon: <Scissors className="w-5 h-5" /> },
  { id: 'pests', label: 'Pest Control', icon: <Bug className="w-5 h-5" /> },
  { id: 'fertilizing', label: 'Fertilizing', icon: <Sprout className="w-5 h-5" /> },
  { id: 'repotting', label: 'Repotting', icon: <Sprout className="w-5 h-5" /> },
  { id: 'trading', label: 'Trading', icon: <Handshake className="w-5 h-5" /> },
  { id: 'general', label: 'General', icon: <Lightbulb className="w-5 h-5" /> },
];

export default function TipsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTips = tips.filter((tip) => {
    const matchesCategory = selectedCategory === 'all' || tip.category === selectedCategory;
    const matchesSearch =
      tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tip.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      watering: 'from-blue-500 to-cyan-500',
      light: 'from-yellow-500 to-orange-500',
      environment: 'from-purple-500 to-pink-500',
      pruning: 'from-green-500 to-emerald-500',
      pests: 'from-red-500 to-rose-500',
      fertilizing: 'from-teal-500 to-green-500',
      repotting: 'from-indigo-500 to-blue-500',
      trading: 'from-amber-500 to-orange-500',
      general: 'from-gray-500 to-slate-500',
    };
    return colors[category] || 'from-plant-green-500 to-emerald-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-plant-green-600 to-emerald-500">
            Plant Care Tips 🌿
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Learn how to keep your plants thriving with expert tips on watering, lighting, pest control, and more!
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search tips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 pl-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-plant-green-500 text-lg"
            />
            <BookOpen className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <div className="flex flex-wrap items-center justify-center gap-3">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-plant-green-600 to-emerald-500 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {category.icon}
                <span>{category.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Tips Grid */}
        {filteredTips.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700"
          >
            <span className="text-7xl mb-4 block">🔍</span>
            <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">
              No tips found matching your search
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredTips.map((tip, index) => (
                <motion.div
                  key={tip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ delay: index * 0.03, type: 'spring', stiffness: 300 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl p-6 border border-gray-100 dark:border-gray-700 transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getCategoryColor(tip.category)} flex items-center justify-center text-white mb-4`}>
                    {tip.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-plant-green-800 dark:text-plant-green-200 mb-3">
                    {tip.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {tip.content}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {tip.category}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Stats Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-300 text-lg mb-2">
              <span className="font-bold text-plant-green-600 dark:text-plant-green-400">{tips.length}</span> expert tips to help your plants thrive
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Happy growing! 🌱
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

