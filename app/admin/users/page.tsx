"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import type { User, UserRole, RoleDefinition } from "@/lib/auth-types"
import { useToast } from "@/hooks/use-toast"
import { Plus, UserMinus, UserCheck, Search, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getAccessibleRoutes } from "@/lib/rbac"
import { apiCall } from "@/lib/api-helpers"

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<RoleDefinition[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [viewUserRoutes, setViewUserRoutes] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    role: "" as UserRole,
  })
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, rolesData] = await Promise.all([apiCall("/api/users"), apiCall("/api/roles")])
        setUsers(usersData)
        setRoles(rolesData)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load data",
          description: error instanceof Error ? error.message : "Unknown error",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [toast])

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.role) {
      toast({ variant: "destructive", title: "Invalid input", description: "Please fill all fields." })
      return
    }

    if (users.some((u) => u.email === newUser.email)) {
      toast({ variant: "destructive", title: "User exists", description: "Email already registered." })
      return
    }

    try {
      const createdUser = await apiCall("/api/users", {
        method: "POST",
        body: JSON.stringify(newUser),
      })

      setUsers([...users, createdUser])
      setIsAddUserOpen(false)
      setNewUser({ email: "", password: "", role: "" })
      toast({ title: "User added", description: `${createdUser.email} has been created.` })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create user",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const toggleUserStatus = async (id: string) => {
    const user = users.find((u) => u.id === id)
    if (!user) return

    try {
      const updatedUser = await apiCall(`/api/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isEnabled: !user.isEnabled }),
      })

      setUsers(users.map((u) => (u.id === id ? updatedUser : u)))
      toast({ title: "Status updated" })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update user",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const filteredUsers = users.filter((u) => u.email.toLowerCase().includes(searchTerm.toLowerCase()))

  const getRoleColor = (roleId: string) => {
    const role = roles.find((r) => r.roleId === roleId)
    return role?.color || "bg-gray-500/10 text-gray-500 border-gray-500/20"
  }

  const getUserRoutes = (roleId: string) => {
    return getAccessibleRoutes(roleId)
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
              <p className="text-muted-foreground">Manage reporting access and user permissions.</p>
            </div>
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Initial Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">User Role</Label>
                    <Select value={newUser.role} onValueChange={(v: UserRole) => setNewUser({ ...newUser, role: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.roleId} value={role.roleId}>
                            {role.roleId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddUser}>Create User</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Access</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isEnabled ? "success" : "destructive"}>
                            {user.isEnabled ? "Active" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog
                            open={viewUserRoutes === user.id}
                            onOpenChange={(open) => setViewUserRoutes(open ? user.id : null)}
                          >
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="gap-1 h-7">
                                <Eye className="h-3 w-3" />
                                <span className="text-xs">{getUserRoutes(user.role).length} routes</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Accessible Routes for {user.email}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {getUserRoutes(user.role).map((route) => (
                                  <div
                                    key={route.route}
                                    className="flex items-center justify-between p-2 border rounded-md"
                                  >
                                    <div>
                                      <p className="text-sm font-medium">{route.label}</p>
                                      <p className="text-xs text-muted-foreground font-mono">{route.route}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={user.role === "ADMIN" && user.email === "piyush@veradium.com"}
                            onClick={() => toggleUserStatus(user.id)}
                          >
                            {user.isEnabled ? (
                              <UserMinus className="h-4 w-4 text-destructive" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-primary" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No users found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
