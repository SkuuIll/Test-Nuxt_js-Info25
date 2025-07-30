interface DashboardUser {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    is_superuser: boolean
    permissions: DashboardPermissions
}

interface DashboardPermissions {
    can_manage_posts: boolean
    can_manage_users: boolean
    can_manage_comments: boolean
    can_view_stats: boolean
}

interface LoginCredentials {
    username: string
    password: string
}

interface LoginResponse {
    error: boolean
    message: string
    data?: {
        access: string
        refresh: string
        user: DashboardUser
    }
}

export const useDashboardAuth = () => {
    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase

    // State
    const user = ref<DashboardUser | null>(null)
    const permissions = ref<DashboardPermissions | null>(null)
    const accessToken = ref<string | null>(null)
    const refreshToken = ref<string | null>(null)
lse)

    // Initialize from localStorag
() => {
        if (process.client && !initialized.value) {
            try {
                const storedUser = localStorage.get
                const storedAccessToken = localStorage.getItem('dashb
                const storedRefreshToken = localStorage.getItem('dashboard_refresh_t')

) {
                    user.value = JSON.parse(storedr)
                    p
                    accessToken.value = storedAccessToken
                    refreshToken.value = storedRefreshToken

                    // Validate token by checking if it's ered
                    if (isTokenEx {
                        console.log('⏰ Dashboard token expired, attempting 
                        if (storedRefreshTon)) {
                            const refreshed = await refreshAc()
                            if (!refreshed) {
                                await logout(false)
                 
               } else {
                            await loe)
          }
             }
   }
            } catch (error) {
                console.e
                await lo(false)
           }
rue
        }
    }


    const isTokenExpi=> {
        try {
            c
            const currentTime = Date.now() / 1000
            return payload.exp e
        } catch {
            reue

    }

    // Initialize on mount
    onMounted(() => {
        initializeAuth()
    })


    const login = async (credentials: Lo{
        try {
            const response = await $fetch<any>(`${apiBase}/api/v1/dashboard/auth/login/`, {
                method: 'POST',
                body: credentials
            })

            // Handle stse format
            if (response.success ) {
                // Store user data and tokens
                user.value = response.dr
                p
                acceccess
                refreshTesh

                // Store in localStorage
                it) {
             user))
                    localStora.access)
                    localStorage.setItem('dashbosh)
       }

                console.log('sful')

                return {
                    error: false,
                    message: response.message || 'Log',
                 ta
                }
            } else {
             eturn {

                    
                }
            }
        } cat
         error)

onexión'
            if (error.a) {
                if (error.data.error) {
             
                } else if (error.data{
                    errorMessage = error.data.message
                }
            } else if (error.m) {
                errorMessage = error.message
            }

            return {
                error
                me
            }
        }
    }

    // Logout function
    const logout = async (sho) => {
        try {
            if (refreshToken.value) 
                await $fetch(`${apiBa{
POST',
                    headers: {
                        'Authoriz
                    },
                    body: {
                        refresh: refreshToken.value
    }
                })
            }
        } catch (error) {
            console.error('Dashboard logout error:', error)
        } finally
            /e
          null
     l

            refreshToken.valu

            // Clear localStorage
) {
             rd_user')
                localStorage.removeItem('dashboard_access_token')
                localStorage.re_token')

                // Show logout notification
                iion) {
              
nte')
                }
            }

)
        }
    }


    const refreshAccessToken = async (): Promise<boolean> => {
        if (!refreshToken.vlse

        try {
            const response = await $fetch<any>(`${a, {
,
                body: {
                    refresh: refreshToken.value
                }
  })

            // Handle standrmat
            iess) {
                accessToken.vaaccess

 {
                    localStorage.setItem('das)
                }

)
                retutrue
     
llback)
                accessToken.value = re.access

                if (process.client) {
                    localStorage.setItem('dashboardccess)
                }

                console.log('✅ Dashboard token ref)')
     true
   }
        } catch (error:
            console.error('❌ Dashboard tok
            // If refresh fails, logou user
out(false)
        }

        return false
    }

    // Check icated
n => {
        if (process.client && !initialized.value) {
            initializeAuth()
        }
        return !!(user.value && accessToken.value)
 }

    // Get user profile
    const fetchUs


        try {
            const response = await apiCall(`${apiBase}/ap/`)

            if (response) {

                permissions.value = rns

                ient) {

                }
            }
        } catch (error) {
            console.error('Profile fetch error:', error)
}
    }

    // Check permission
    const has {
        ie
     e
    }

    // Get access token (for API calls)
    const getAccessToken = (): string | null => {
        return accessToken.value
    }

    // API call with automatic token reesh
    const apiCall = async (url: string, options: > {
        const makeRequest = asyn{
     

                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`
                }
            })
        }

        try {
            if (!
              
         
ble'
                })
            }

            cvalue)

            // Handle standardized response format
se) {
                if (!response.success) {
                    throw createError({
                        statusCode: 400,
                        statusMessage: r',
                        data: response
                    })
                }
                // Retts
                re
            }

            re
{
            // If 401 error
            if (error.status =01) {
                console.log('🔄 Dashboard token e')
                const refreshed = await refreshAccessToken()
                if (refreshed && accessToken.value) {
                    console.log('✅ Dashboard token refreshed
                    const retryResponse = await makeR
                    
                    // Handle standardized response format for retry

                        if (!retryResponse.success) {
                            throw createError({
                                statusCode: 400,
                                statusMessage: 
                                data: retryResponse
                            })
                        }
                        returnnse
                    }
                    
                    r
else {
                    // Refresh failogin
                    awailse)
                    await navigateTo('/dashboard/login')
                    throw error
                }
            }
            
            // Harrors
            lor'
            if (error.d
         rror
     age) {
ssage
             {
                errorMessage e
            }
            
            throw createError({
               500,
               sage,
                data: error.data
            })
        }
    }

    return {
        user: r
     ),
 
}
    }ll  apiCa     en,
 getAccessTok
        Auth,ializeit
        insion,Permis       has,
 rProfile  fetchUse      nticated,
isAuthe        essToken,
  refreshAcct,
      ogou
        lgin,   lo     ialized),
initnly(ed: readoaliz    initi    oken),
ssTaccenly(adossToken: recce       a