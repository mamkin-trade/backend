// Dependencies
import Semaphore from 'semaphore-async-await'

const locks = {}
export async function executeLocked(id: string, fun: Function | Promise<any>) {
  // Lock semaphore
  let lock = locks[id]
  if (!lock) {
    lock = new Semaphore(1)
    locks[id] = lock
  }
  await lock.wait()
  // Execute
  let result
  try {
    if (fun instanceof Function) {
      result = await fun()
    } else {
      result = await fun
    }
  } catch (err) {
    throw err
  } finally {
    // Release lock
    lock.signal()
  }
  return result
}
