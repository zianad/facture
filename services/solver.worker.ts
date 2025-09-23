// solver.worker.ts

// A highly efficient Dynamic Programming solution to find the combination of items that sums closest to the target amount.
// This approach is much faster than backtracking, especially when item quantities are large.
const findCombinationWithDP = (items, target) => {
    const targetInCents = Math.round(target * 100);
    if (targetInCents <= 0 || items.length === 0) return null;

    const itemMap = new Map();
    let maxItemPriceInCents = 0;

    items.forEach(item => {
        if(!itemMap.has(item.id)) itemMap.set(item.id, item);
        const priceInCents = Math.round(item.price * 100);
        if (priceInCents > maxItemPriceInCents) {
            maxItemPriceInCents = priceInCents;
        }
    });

    if (maxItemPriceInCents <= 0) return null;

    // The upper bound for our search space. We search for sums slightly above the target
    // to find a potentially closer match. The buffer is the price of the most expensive single item.
    const searchUpperBound = targetInCents + maxItemPriceInCents;


    // 1. Binary Splitting: Convert the "Bounded Knapsack" problem into a "0/1 Knapsack" problem.
    // This is a standard trick to handle quantities efficiently in DP without a performance hit.
    // An item with quantity 13 is broken into items representing quantities 1, 2, 4, and 6.
    // This allows the DP to form any quantity sum from 1 to 13.
    const zeroOneItems = [];
    items.forEach(item => {
        let quantity = item.quantity;
        let powerOfTwo = 1;
        while (quantity > 0) {
            const currentPortion = Math.min(quantity, powerOfTwo);
            zeroOneItems.push({
                originalId: item.id,
                priceInCents: Math.round(item.price * 100 * currentPortion),
                portion: currentPortion
            });
            quantity -= currentPortion;
            powerOfTwo *= 2;
        }
    });

    if (zeroOneItems.length === 0) return null;

    // 2. Solve the 0/1 Knapsack problem using Dynamic Programming.
    // dp[s] = true if sum 's' is reachable.
    const dp = new Array(searchUpperBound + 1).fill(false);
    // path[s] stores the item and previous sum to allow for reconstructing the solution.
    const path = new Array(searchUpperBound + 1).fill(null); 
    dp[0] = true;

    for (const zItem of zeroOneItems) {
        if (zItem.priceInCents <= 0) continue;
        // Iterate downwards to ensure each "split" item is used at most once.
        for (let s = searchUpperBound; s >= zItem.priceInCents; s--) {
            if (dp[s - zItem.priceInCents] && !dp[s]) {
                dp[s] = true;
                path[s] = { item: zItem, prevSum: s - zItem.priceInCents };
            }
        }
    }

    // 3. Find the sum in the dp table that is closest to the target.
    let bestSum = -1;
    let minDiff = Infinity;
    for (let s = 0; s <= searchUpperBound; s++) {
        if (dp[s]) {
            const diff = Math.abs(s - targetInCents);
            if (diff < minDiff) {
                minDiff = diff;
                bestSum = s;
            } else if (diff === minDiff && s > bestSum) {
                // If differences are equal, prefer the sum that is slightly over to the one under.
                bestSum = s;
            }
        }
    }

    if (bestSum <= 0) {
        return null;
    }

    // 4. Reconstruct the path to determine which items and quantities were used.
    const itemCounts = new Map();
    let currentSum = bestSum;
    while (currentSum > 0 && path[currentSum]) {
        const trace = path[currentSum];
        const originalId = trace.item.originalId;
        itemCounts.set(originalId, (itemCounts.get(originalId) || 0) + trace.item.portion);
        currentSum = trace.prevSum;
    }

    // 5. Build the final array of original item objects based on the counts.
    const resultItems = [];
    for (const [id, count] of itemCounts.entries()) {
        const originalItem = itemMap.get(id);
        if (originalItem) {
            for (let i = 0; i < count; i++) {
                resultItems.push(originalItem);
            }
        }
    }

    return resultItems.length > 0 ? resultItems : null;
};


// Listen for messages from the main thread.
self.onmessage = (event) => {
  const { items, target } = event.data;
  const result = findCombinationWithDP(items, target);
  // Send the result back to the main thread.
  self.postMessage(result);
};