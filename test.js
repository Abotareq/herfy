/**
 * | **Aspect**                | **Without Session**                                                        | **With Session (no transaction)**                                                                                  | **With Session + Transaction**                                                                                                                                                                                                                    |
| ------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Meaning**               | Each DB operation is isolated, no shared context                           | Operations share a context for options like read concern, causal consistency, etc.                                 | Multiple operations are executed as a single atomic unit (all succeed or all rollback)                                                                                                                                                            |
| **Use Cases**             | - Simple queries and writes that do not depend on consistency between them | - Ensuring read-your-own-write consistency in replica sets <br> - Pinning reads/writes to the same session context | - Payments <br> - Stock deduction with order creation <br> - Multi-document updates that must remain consistent                                                                                                                                   |
| **How to create**         | No session created                                                         | `const session = await mongoose.startSession();` <br> Pass `{ session }` in operations                             | Same as left, but also call `session.startTransaction()`                                                                                                                                                                                          |
| **Commit / Abort**        | Not applicable                                                             | No commit or abort needed as no transaction                                                                        | Must call `await session.commitTransaction()` or `await session.abortTransaction()`                                                                                                                                                               |
| **Impact on performance** | Fastest, minimal overhead                                                  | Slight overhead due to session tracking                                                                            | Slowest due to ACID guarantees, use only when necessary                                                                                                                                                                                           |
| **Example**               | `User.findById(id)`                                                        | `User.findById(id).session(session)`                                                                               | `js const session = await mongoose.startSession(); session.startTransaction(); const user = await User.findById(id).session(session); user.name = "New"; await user.save({ session }); await session.commitTransaction(); session.endSession(); ` |
| **Notes**                 | ✅ No session needed for standalone operations                              | ✅ Useful for causal consistency reads <br> ✅ Useful for MongoDB Change Streams                                     | ⚠️ All operations within transaction **must use same session** <br> ⚠️ Recommended only for cross-collection consistency needs                                                                                                                    |

 */

import mongoose from "mongoose";
import Payment from "./models/paymentModel";
import User from "./models/userModel";

const session = await mongoose.startSession()

// transaction 
session.startTransaction();

Payment.create([],{session})
Payment.updateOne([],{session})
Payment.findById().session(session)
Payment.deleteOne().session(session)

await session.commitTransaction()
await session.endSession()
//  error

await session.abortTransaction()
session.endSession()

//######################################## Promise.all ###########################################

/* 
✅ Conclusion: Promise.all in English
🔷 Promise.all is a powerful tool in JavaScript to:

Run multiple promises concurrently (at the same time).

Wait for all of them to finish.

Return results as an array in the same order as the promises passed.

🚀 When to use it?
✅ When you have multiple independent asynchronous operations
✅ And you want to reduce total execution time
✅ Example: Fetching users, orders, and notifications together.

⚠️ Key Note:
❌ If any promise fails, Promise.all rejects immediately with that error, and other results are not returned.

✨ Final takeaway:
Use Promise.all to optimize performance when multiple tasks do not depend on each other’s results, allowing you to execute them faster and more efficiently.

*/

const [payments , users] = await Promise.all([Payment.find() ,User.find()])
