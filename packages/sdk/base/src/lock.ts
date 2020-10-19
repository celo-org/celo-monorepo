import { EventEmitter } from 'events'

enum LockEvent {
  Unlock = 'unlock',
}

// Lock which can be used to ensure mutual exclusion in concurrent code.
//
// This lock is non-reentrant, and attempting to acquire it while holding the lock will result in a deadlock.
export class Lock {
  private locked: boolean = false
  private emitter: EventEmitter

  constructor() {
    this.emitter = new EventEmitter()
  }

  // Attempt to acquire the lock without blocking.
  // @returns {boolean} True if the lock was acquired.
  tryAcquire(): boolean {
    if (!this.locked) {
      this.locked = true
      return true
    }
    return false
  }

  // Acquire the lock, blocking until the lock is available.
  acquire(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Attempt to grab the lock without waiting.
      if (this.tryAcquire()) {
        resolve()
        return
      }

      // Wait for an event emitted when releasing the lock.
      const callback = () => {
        try {
          if (this.tryAcquire()) {
            this.emitter.removeListener(LockEvent.Unlock, callback)
            resolve()
          }
        } catch (error) {
          reject(error)
        }
      }
      this.emitter.on(LockEvent.Unlock, callback)
    })
  }

  // Release the lock such that another caller can acquire it.
  // If not locked, calling this method has no effect.
  release() {
    if (this.locked) {
      this.locked = false
      this.emitter.emit(LockEvent.Unlock)
    }
  }
}
