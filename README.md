# Dairy & FPO ERP System

A complete, production-ready ERP (Enterprise Resource Planning) frontend for agricultural cooperatives and dairy organizations. Built with React, Vite, Tailwind CSS, and Supabase.

## Features

- **Complete ERP Modules**
  - Dashboard with KPIs and charts
  - Member/Farmer management
  - Inventory batch tracking
  - Transaction/Billing management
  - AI (Artificial Insemination) records
  - Product catalog
  - Warehouse locations
  - Technician management
  - Analytics and reporting

- **Modern UI/UX**
  - Responsive design (desktop, tablet, mobile)
  - Dark green professional theme
  - Clean SaaS-like interface
  - Touch-optimized forms
  - Collapsible sidebar on mobile
  - Loading skeletons and empty states

- **Technical Stack**
  - React 19 + TypeScript
  - Vite for fast builds
  - Tailwind CSS for styling
  - React Query for data fetching
  - React Router for navigation
  - React Hook Form for form handling
  - Zod for validation
  - Recharts for data visualization
  - Supabase as backend

## Project Structure

```
src/
├── app/                 # App configuration
├── components/
│   ├── layout/         # Sidebar, Topbar, AppLayout
│   ├── shared/         # StatCard, PageHeader, etc.
│   ├── forms/          # FormInput, FormSelect
│   └── tables/         # Data table components
├── pages/              # Feature pages
│   ├── auth/           # Login
│   ├── dashboard/
│   ├── members/
│   ├── inventory/
│   ├── transactions/
│   ├── ai-records/
│   ├── analytics/
│   ├── technicians/
│   ├── products/
│   ├── locations/
│   └── settings/
├── services/           # Supabase API calls
├── hooks/              # React Query hooks
├── lib/                # Utilities (Supabase client)
├── types/              # TypeScript interfaces
├── utils/              # Helper functions
├── providers/          # Context providers (Auth)
└── routes/             # Router configuration
```

## Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Fill in your Supabase credentials:

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## Tech Stack Details

### Frontend

- **React 19**: Modern UI library with hooks
- **TypeScript**: Type-safe development
- **Vite**: Ultra-fast build tool
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Radix UI components

### State Management & Data

- **React Query**: Async state management
- **React Hook Form**: Efficient form handling
- **Zod**: Schema validation

### Visualization

- **Recharts**: Chart library for analytics
- **Lucide React**: Icon library

### Backend Integration

- **Supabase**: PostgreSQL + Auth + RPC

## Key Patterns

### Authentication

- Email/password login with Supabase Auth
- Role-based access control (ADMIN, TECHNICIAN)
- Protected routes component
- Session persistence

### Data Fetching

- React Query for caching and synchronization
- Custom hooks for each module (useMembers, useInventory, etc.)
- Automatic refetching and invalidation

### Forms

- React Hook Form + Zod validation
- Reusable form components
- Proper error handling and display

### Responsive Design

- Mobile-first approach
- Collapsible sidebar on mobile
- Optimized tables with horizontal scroll
- Touch-friendly button sizes

## Color Palette

| Color          | Hex     | Usage                      |
| -------------- | ------- | -------------------------- |
| Primary        | #1F4D3A | Buttons, links, highlights |
| Dark           | #163829 | Sidebar, headers           |
| Light          | #DDEFE5 | Backgrounds, light UI      |
| Background     | #F7F8F5 | Page background            |
| Card           | #FFFFFF | Card backgrounds           |
| Text Primary   | #1E1E1E | Main text                  |
| Text Secondary | #5F6368 | Labels, hints              |
| Border         | #E5E7EB | Dividers, borders          |
| Success        | #16A34A | Success states             |
| Warning        | #D97706 | Warnings                   |
| Danger         | #DC2626 | Errors, destructive        |

## Development Guidelines

### Component Naming

- Page components: `PageName.tsx` (e.g., `DashboardPage.tsx`)
- Reusable components: Descriptive names (e.g., `StatCard.tsx`)
- Avoid generic names like `Component1.tsx`

### Type Safety

- Define all types in `src/types/index.ts`
- Use interfaces for objects, types for unions
- Avoid `any` type

### Services

- One service file per module
- Group related API calls
- Use Supabase views for reads, RPC for mutations

### Hooks

- Custom React Query hooks in `src/hooks/`
- One hook file per module
- Export both query and mutation hooks

### Error Handling

- Try-catch in async functions
- User-friendly error messages
- Loading and error states in UI

## Supabase Setup

### Required Tables

The application expects these Supabase tables:

- `members` - Farmer/member data
- `products` - Product catalog
- `batches` - Inventory batches
- `locations` - Warehouse locations
- `transactions` - Billing records
- `ai_records` - AI procedure records

### Required RPC Functions

- `create_sale_transaction(transaction_data)` - Create a transaction
- `add_stock(batch_id, quantity)` - Add inventory
- `damage_stock(batch_id, quantity)` - Mark stock as damaged
- `return_stock(batch_id, quantity)` - Process returns
- `get_member_outstanding(member_id)` - Calculate outstanding amount
- `get_conception_rate(start_date, end_date)` - Calculate AI success rate

## Testing

The app includes mock data for demonstration. Replace with real Supabase queries to connect to your backend.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Performance

- Code splitting with React Router
- Image optimization
- CSS bundling with Tailwind
- React Query caching strategy
- Lazy loading of routes

## Future Enhancements

- [ ] Dark mode support
- [ ] Advanced filtering and search
- [ ] Bulk operations
- [ ] QR code scanning integration
- [ ] Offline mode
- [ ] Mobile app (React Native)
- [ ] Real-time updates with Supabase subscriptions
- [ ] Advanced reporting and exports

## Contributing

1. Follow TypeScript best practices
2. Keep components small and focused
3. Use semantic HTML
4. Maintain consistency with existing patterns
5. Test responsive behavior

## License

Proprietary - Dairy Cooperative ERP System

## Support

For issues and questions, contact the development team.
