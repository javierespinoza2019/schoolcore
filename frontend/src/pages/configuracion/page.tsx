import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/feature/MainLayout';
import Tabs from '@/components/base/Tabs';
import { useToast } from '@/components/base/Toast';
import GeneralTab from '@/pages/configuracion/components/GeneralTab';
import CiclosTab from '@/pages/configuracion/components/CiclosTab';
import PagosTab from '@/pages/configuracion/components/PagosTab';
import CatalogosTab from '@/pages/configuracion/components/CatalogosTab';
import UsuariosTab from '@/pages/configuracion/components/UsuariosTab';
import EmailTemplatesTab from '@/pages/configuracion/components/EmailTemplatesTab';
import { useApiResource } from '@/hooks/useApiResource';
import { queryKeys } from '@/api/queryKeys';
import * as settingsApi from '@/api/settingsApi';
import * as cyclesApi from '@/api/cyclesApi';
import type { ConceptoPago } from '@/mocks/configuracion';

export default function Configuracion() {
  const [saved, setSaved] = useState(false);
  const [nombre, setNombre] = useState('');
  const [rfc, setRfc] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [sitio, setSitio] = useState('');
  const [direccion, setDireccion] = useState('');
  const [timeZoneId, setTimeZoneId] = useState('America/Mexico_City');

  const [ciclos, setCiclos] = useState<
    { id: string; nombre: string; inicio: string; fin: string; activo: boolean }[]
  >([]);
  const [metodos, setMetodos] = useState<
    { id: string; nombre: string; activo: boolean; info: string }[]
  >([]);
  const [conceptos, setConceptos] = useState<ConceptoPago[]>([]);
  const [niveles, setNiveles] = useState<
    { id: string; nombre: string; grados: number; activo: boolean }[]
  >([]);
  const [roles, setRoles] = useState<
    { id: string; nombre: string; usuarios: number; descripcion: string }[]
  >([]);
  const [notificaciones, setNotificaciones] = useState<
    { id: string; nombre: string; descripcion: string; activo: boolean; canal: string }[]
  >([]);

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const tenantQ = useApiResource({
    queryKey: queryKeys.settings.tenant(),
    queryFn: () => settingsApi.getTenantSettings(),
  });
  const cyclesQ = useApiResource({
    queryKey: queryKeys.cycles.list(),
    queryFn: () => cyclesApi.listCycles(),
  });
  const methodsQ = useApiResource({
    queryKey: queryKeys.settings.paymentMethods(),
    queryFn: () => settingsApi.listPaymentMethods(),
  });
  const conceptsQ = useApiResource({
    queryKey: queryKeys.settings.paymentConcepts(),
    queryFn: () => settingsApi.listPaymentConcepts(),
  });
  const levelsQ = useApiResource({
    queryKey: queryKeys.settings.catalogs(),
    queryFn: () => settingsApi.listEducationLevels(),
  });
  const rolesQ = useApiResource({
    queryKey: ['settings', 'roles'],
    queryFn: () => settingsApi.listRoles(),
  });
  const notifQ = useApiResource({
    queryKey: ['settings', 'notification-settings'],
    queryFn: () => settingsApi.listNotificationSettings(),
  });

  useEffect(() => {
    if (!tenantQ.data) return;
    setNombre(tenantQ.data.nombreCompleto);
    setRfc(tenantQ.data.rfc);
    setTelefono(tenantQ.data.telefono);
    setEmail(tenantQ.data.email);
    setSitio(tenantQ.data.sitioWeb);
    setDireccion(tenantQ.data.direccion);
    setTimeZoneId(tenantQ.data.timeZoneId || 'America/Mexico_City');
  }, [tenantQ.data]);

  useEffect(() => {
    if (cyclesQ.data) setCiclos(cyclesQ.data);
  }, [cyclesQ.data]);
  useEffect(() => {
    if (methodsQ.data) setMetodos(methodsQ.data);
  }, [methodsQ.data]);
  useEffect(() => {
    if (conceptsQ.data) setConceptos(conceptsQ.data);
  }, [conceptsQ.data]);
  useEffect(() => {
    if (levelsQ.data) setNiveles(levelsQ.data);
  }, [levelsQ.data]);
  useEffect(() => {
    if (rolesQ.data) setRoles(rolesQ.data);
  }, [rolesQ.data]);
  useEffect(() => {
    if (notifQ.data) setNotificaciones(notifQ.data);
  }, [notifQ.data]);

  const handleSaveGeneral = async () => {
    const res = await settingsApi.updateTenantSettings({
      nombre: nombre || undefined,
      nombreCompleto: nombre,
      rfc,
      telefono,
      email,
      sitioWeb: sitio,
      direccion,
      timeZoneId,
    });
    if (res.success || tenantQ.isFallback) {
      setSaved(true);
      showToast('Configuración general guardada. Los registros anteriores no se modifican.', 'success');
      setTimeout(() => setSaved(false), 2500);
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings.tenant() });
      void queryClient.invalidateQueries({ queryKey: ['context', 'timezone'] });
    } else {
      showToast(res.message || 'No se pudo guardar', 'error');
    }
  };

  const tabs = [
    {
      id: 'general',
      label: 'General',
      icon: 'ri-building-line',
      content: (
        <GeneralTab
          saved={saved}
          nombre={nombre}
          rfc={rfc}
          telefono={telefono}
          email={email}
          sitio={sitio}
          direccion={direccion}
          timeZoneId={timeZoneId}
          onNombreChange={setNombre}
          onRfcChange={setRfc}
          onTelefonoChange={setTelefono}
          onEmailChange={setEmail}
          onSitioChange={setSitio}
          onDireccionChange={setDireccion}
          onTimeZoneChange={setTimeZoneId}
          onSave={handleSaveGeneral}
        />
      ),
    },
    {
      id: 'ciclos',
      label: 'Ciclos Escolares',
      icon: 'ri-calendar-2-line',
      content: <CiclosTab ciclos={ciclos} onUpdate={setCiclos} />,
    },
    {
      id: 'pagos',
      label: 'Métodos de Pago',
      icon: 'ri-bank-card-line',
      content: (
        <PagosTab
          metodos={metodos}
          conceptos={conceptos}
          onMetodosUpdate={setMetodos}
          onConceptosUpdate={setConceptos}
        />
      ),
    },
    {
      id: 'catalogos',
      label: 'Catálogos',
      icon: 'ri-book-open-line',
      content: (
        <CatalogosTab
          niveles={niveles}
          roles={roles}
          notificaciones={notificaciones}
          onNivelesUpdate={setNiveles}
          onRolesUpdate={setRoles}
          onNotificacionesUpdate={setNotificaciones}
        />
      ),
    },
    {
      id: 'usuarios',
      label: 'Usuarios',
      icon: 'ri-group-line',
      content: <UsuariosTab />,
    },
    {
      id: 'email',
      label: 'Email',
      icon: 'ri-mail-settings-line',
      content: <EmailTemplatesTab />,
    },
  ];

  return (
    <MainLayout>
      <div className="max-w-[1440px] mx-auto">
        <div className="mb-5">
          <h1 className="text-lg font-bold text-foreground-900 tracking-tight">Configuración</h1>
          <p className="text-xs text-foreground-500 mt-0.5">
            Administra los parámetros generales del sistema, catálogos y usuarios
          </p>
        </div>

        <Tabs tabs={tabs} defaultTab="general" />
      </div>
    </MainLayout>
  );
}
