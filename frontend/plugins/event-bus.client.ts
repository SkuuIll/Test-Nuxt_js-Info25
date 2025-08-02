/**
 * Event bus plugin for client-side event communication
 */
export default defineNuxtPlugin(() => {
    // Simple event bus implementation
    const events: Record<string, Function[]> = {}

    const eventBus = {
        on(event: string, callback: Function) {
            if (!events[event]) {
                events[event] = []
            }
            events[event].push(callback)
        },

        off(event: string, callback: Function) {
            if (events[event]) {
                const index = events[event].indexOf(callback)
                if (index > -1) {
                    events[event].splice(index, 1)
                }
            }
        },

        emit(event: string, ...args: any[]) {
            if (events[event]) {
                events[event].forEach(callback => {
                    try {
                        callback(...args)
                    } catch (error) {
                        console.error(`Error in event handler for ${event}:`, error)
                    }
                })
            }
        },

        once(event: string, callback: Function) {
            const onceCallback = (...args: any[]) => {
                callback(...args)
                this.off(event, onceCallback)
            }
            this.on(event, onceCallback)
        },

        clear(event?: string) {
            if (event) {
                delete events[event]
            } else {
                Object.keys(events).forEach(key => delete events[key])
            }
        }
    }

    return {
        provide: {
            bus: eventBus
        }
    }
})