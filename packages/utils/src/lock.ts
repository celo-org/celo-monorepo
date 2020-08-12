import { EventEmitter } from 'events'

enum LockEvent {
  Unlock = 'unlock',
}

// Lock which can be used to ensure mutual exclusion in concurrent code.
export class Lock {
  private locked: boolean = false
  private emitter: EventEmitter

  constructor() {
    this.emitter = new EventEmitter()
  }

  // Attempt to aquire the lock without blocking.
  //
  // @returns {boolean} True if the lock was aquired.
  tryAcquire(): boolean {
    if (!this.locked) {
      this.locked = true
      return true
    }
    return false
  }

  // Aquire the lock, blocking until the lock is available.
  acquire(): Promise<void> {
    return new Promise((resolve) => {
      // Attempt to grab the lock without waiting.
      if (this.tryAcquire()) {
        resolve()
        return
      }

      // Wait for an event emitted when releasing the lock.
      const callback = () => {
        if (this.tryAcquire()) {
          this.emitter.removeListener(LockEvent.Unlock, callback)
          resolve()
        }
      }
      this.emitter.on(LockEvent.Unlock, callback)
    })
  }

  // Release the lock such that another caller can aquire it.
  release() {
    if (this.locked) {
      this.locked = false
      this.emitter.emit(LockEvent.Unlock)
    }
  }
}
