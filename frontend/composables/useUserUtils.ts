/**
 * Composable for user-related utilities
 */

export const useUserUtils = () => {
    /**
     * Get user initials safely
     */
    const getUserInitials = (user: any): string => {
        if (!user) return 'U'

        const firstName = user.first_name || user.firstName || ''
        const lastName = user.last_name || user.lastName || ''
        const username = user.username || user.name || ''

        // Try to get initials from first and last name
        if (firstName && lastName) {
            return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
        }

        // Try to get initial from first name only
        if (firstName) {
            return firstName.charAt(0).toUpperCase()
        }

        // Try to get initial from username
        if (username) {
            return username.charAt(0).toUpperCase()
        }

        // Fallback
        return 'U'
    }

    /**
     * Get user display name safely
     */
    const getUserDisplayName = (user: any): string => {
        if (!user) return 'Usuario'

        const firstName = user.first_name || user.firstName || ''
        const lastName = user.last_name || user.lastName || ''
        const username = user.username || user.name || ''
        const fullName = user.full_name || user.fullName || ''

        // Try full name first
        if (fullName) return fullName

        // Try first + last name
        if (firstName && lastName) {
            return `${firstName} ${lastName}`
        }

        // Try first name only
        if (firstName) return firstName

        // Try username
        if (username) return username

        // Fallback
        return 'Usuario'
    }

    /**
     * Get author initials safely (for posts/comments)
     */
    const getAuthorInitials = (author: any): string => {
        return getUserInitials(author)
    }

    /**
     * Get author display name safely (for posts/comments)
     */
    const getAuthorDisplayName = (author: any): string => {
        return getUserDisplayName(author)
    }

    return {
        getUserInitials,
        getUserDisplayName,
        getAuthorInitials,
        getAuthorDisplayName
    }
}