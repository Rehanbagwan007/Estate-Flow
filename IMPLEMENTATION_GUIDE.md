# EstateFlow CRM - Implementation Guide

## 🚀 Overview

This document outlines the comprehensive real estate CRM system built with Next.js 15, Supabase, and modern web technologies. The system supports multiple user roles with role-based access control, property management, call integration, and WhatsApp notifications.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Database, Auth, Storage)
- **State Management**: Zustand
- **Integrations**: Exotel (Call Management), Meta WhatsApp Business API
- **Deployment**: Vercel (recommended)

### Database Schema
The system uses the following main tables:
- `profiles` - User profiles with role-based access
- `properties` - Property listings
- `property_interests` - Customer interest expressions
- `appointments` - Scheduled meetings
- `call_logs` - Call records and recordings
- `agent_assignments` - Agent-customer assignments
- `notifications` - System notifications
- `field_visits` - GPS tracking for agents

## 👥 User Roles & Permissions

### 1. Super Admin (MD Level)
- **Access**: Full system control
- **Features**: 
  - Complete analytics dashboard
  - User management and approval
  - Call recording access
  - System settings and integrations
  - Performance monitoring

### 2. Admin
- **Access**: Operational management
- **Features**:
  - User approval workflow
  - Property management
  - Agent assignments
  - Call recording monitoring
  - Basic analytics

### 3. Caller 1 & Caller 2
- **Access**: Call center operations
- **Features**:
  - Exotel call interface
  - Call history and recordings
  - Customer contact management
  - Performance tracking

### 4. Sales Manager
- **Access**: Sales team oversight
- **Features**:
  - Team performance monitoring
  - Lead assignment
  - Sales analytics
  - Target setting

### 5. Sales Executive 1 & 2
- **Access**: Customer relationship management
- **Features**:
  - Assigned customer management
  - Follow-up tracking
  - Call management
  - Performance metrics

### 6. Customer (Approved Only)
- **Access**: Property browsing and interest
- **Features**:
  - Property search and filtering
  - Interest expression
  - Appointment scheduling
  - WhatsApp notifications

## 🔧 Key Features Implemented

### 1. Role-Based Access Control
- **Middleware**: Automatic role-based route protection
- **Database Policies**: Row-level security (RLS) for data access
- **UI Components**: Role-specific navigation and dashboards

### 2. Customer Approval System
- **Registration Flow**: Customers start with "pending" status
- **Admin Approval**: Dashboard for user approval/rejection
- **Notifications**: WhatsApp alerts for approval status
- **Access Control**: Non-approved customers redirected to pending page

### 3. Property Management
- **Enhanced Listings**: Advanced filtering and search
- **Interest System**: Customer interest expression with meeting scheduling
- **Agent Assignment**: Automatic assignment workflow
- **Status Tracking**: Property availability management

### 4. Call Management (Exotel Integration)
- **Call Interface**: Web-based calling system
- **Recording**: Automatic call recording and storage
- **History**: Call logs and performance tracking
- **Integration**: Simulated Exotel API calls

### 5. WhatsApp Notifications
- **Property Interest**: Confirmation messages
- **Appointment Reminders**: 30-minute advance notifications
- **Approval Alerts**: Account status notifications
- **Meeting Confirmations**: Scheduled visit confirmations

### 6. Dashboard System
- **Role-Specific**: Customized dashboards for each role
- **Analytics**: Performance metrics and KPIs
- **Real-time Updates**: Live data and notifications
- **Quick Actions**: Common task shortcuts

## 📱 API Endpoints

### Authentication & Users
- `POST /api/admin/approve-user` - Approve/reject users
- `GET /api/property-interests` - Get property interests
- `POST /api/property-interests` - Create property interest

### Call Management
- `POST /api/calls/initiate` - Start a call
- `POST /api/calls/end` - End a call
- `GET /api/calls/recent` - Get call history

### Notifications
- `POST /api/cron/appointment-reminders` - Schedule reminders
- `POST /api/admin/assign-agent` - Assign agent to customer

## 🔐 Security Features

### Row-Level Security (RLS)
- **Profiles**: Users can only see their own data
- **Properties**: Role-based property access
- **Call Logs**: Agents see only their calls, admins see all
- **Assignments**: Role-based assignment visibility

### Middleware Protection
- **Route Guards**: Automatic role-based access control
- **Session Validation**: Secure authentication checks
- **Redirect Logic**: Proper user flow management

## 🚀 Deployment Setup

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# WhatsApp Integration
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token

# Exotel Integration
EXOTEL_API_URL=your_exotel_api_url
EXOTEL_API_KEY=your_exotel_api_key

# Cron Jobs
CRON_SECRET=your_cron_secret
```

### Database Migration
1. Run the migration files in order:
   - `0000_init.sql` (existing)
   - `0001_add_files_column.sql` (existing)
   - `0002_extend_schema_for_crm.sql` (new)

### Cron Job Setup
Set up a cron job to run appointment reminders:
```bash
# Every 5 minutes
*/5 * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/appointment-reminders
```

## 📊 Monitoring & Analytics

### Key Metrics Tracked
- **User Metrics**: Registration, approval rates, activity
- **Property Metrics**: Listings, interests, conversions
- **Call Metrics**: Volume, duration, success rates
- **Sales Metrics**: Assignments, completions, performance

### Dashboard Analytics
- **Super Admin**: Complete system overview
- **Admin**: Operational metrics
- **Sales Manager**: Team performance
- **Agent**: Personal metrics and assignments

## 🔄 Workflow Examples

### Customer Journey
1. **Registration**: Customer signs up → Pending approval
2. **Approval**: Admin approves → WhatsApp notification sent
3. **Property Browse**: Customer searches and filters properties
4. **Interest Expression**: Customer clicks "I'm Interested"
5. **Agent Assignment**: Admin assigns agent → Notifications sent
6. **Meeting**: Agent contacts customer → Appointment scheduled
7. **Reminder**: WhatsApp reminder 30 minutes before meeting
8. **Follow-up**: Agent updates status and notes

### Agent Workflow
1. **Assignment**: Agent receives customer assignment
2. **Contact**: Agent calls customer using Exotel interface
3. **Meeting**: Schedule and conduct property visits
4. **Follow-up**: Update customer status and notes
5. **Reporting**: Track performance and conversions

## 🛠️ Development Guidelines

### Code Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   └── api/               # API routes
├── components/            # Reusable components
│   ├── dashboard/         # Dashboard components
│   ├── properties/       # Property components
│   └── calls/            # Call management components
├── lib/                   # Utilities and services
│   ├── notifications/    # Notification services
│   └── supabase/         # Database client
└── hooks/                 # Custom React hooks
```

### Best Practices
- **Type Safety**: Full TypeScript implementation
- **Error Handling**: Comprehensive error boundaries
- **Loading States**: Skeleton loaders and spinners
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG compliance

## 🚀 Future Enhancements

### Planned Features
1. **Mobile App**: React Native implementation
2. **Advanced Analytics**: Machine learning insights
3. **Video Calls**: Integrated video calling
4. **Document Management**: Property document handling
5. **Payment Integration**: Online payment processing
6. **Multi-language**: Internationalization support

### Integration Opportunities
- **CRM Systems**: Salesforce, HubSpot integration
- **Marketing**: Email campaigns, social media
- **Analytics**: Google Analytics, Mixpanel
- **Communication**: Slack, Microsoft Teams

## 📞 Support & Maintenance

### Regular Tasks
- **Database Cleanup**: Archive old records
- **Performance Monitoring**: Track system metrics
- **Security Updates**: Regular dependency updates
- **Backup Management**: Automated backups

### Monitoring
- **Uptime**: System availability tracking
- **Performance**: Response time monitoring
- **Errors**: Error logging and alerting
- **Usage**: User activity analytics

## 🎯 Success Metrics

### Key Performance Indicators
- **User Engagement**: Daily/monthly active users
- **Conversion Rates**: Interest to meeting conversion
- **Call Success**: Call completion rates
- **Response Times**: Agent response to interests
- **Customer Satisfaction**: Feedback and ratings

This implementation provides a comprehensive real estate CRM system with modern architecture, robust security, and scalable design patterns.
