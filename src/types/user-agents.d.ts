declare module 'user-agents' {
  class UserAgent {
    constructor(options?: { browserName?: string; platform?: string })
    toString(): string
  }
  export default UserAgent
}

