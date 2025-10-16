'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { PropertiesTable } from '@/components/properties/properties-table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { usePropertyStore } from '@/lib/store/property-store';
import { useEffect, useRef } from 'react';
import type { Property } from '@/lib/types';

interface PropertiesClientProps {
  initialProperties: Property[];
}

export function PropertiesClient({ initialProperties }: PropertiesClientProps) {
  const setProperties = usePropertyStore((state) => state.setProperties);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      setProperties(initialProperties);
      initialized.current = true;
    }
  }, [initialProperties, setProperties]);

  const properties = usePropertyStore((state) => state.properties);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Properties</CardTitle>
          <CardDescription>Manage your property listings.</CardDescription>
        </div>
        <Button asChild size="sm" className="gap-1">
          <Link href="/properties/new">
            <PlusCircle className="h-4 w-4" />
            New Property
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <PropertiesTable properties={properties} />
      </CardContent>
    </Card>
  );
}
