<script setup>
import { useAsesmenStore } from '@/stores/asesmen';
import { useTahunAkademikStore } from '@/stores/tahunAkademik';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';

const store = useAsesmenStore();
const tahunStore = useTahunAkademikStore();
const { studentGradeList: grades, isLoading, error } = storeToRefs(store);
const { list: academicYears } = storeToRefs(tahunStore);

const selectedYear = ref(null);
const selectedCourse = ref(null);
const detailVisible = ref(false);

const totalSks = computed(() => grades.value.reduce((total, item) => total + Number(item.sks || 0), 0));
const semesterIndex = computed(() => {
    const weighted = grades.value.reduce((total, item) => total + Number(item.nilai_indeks || 0) * Number(item.sks || 0), 0);
    return totalSks.value ? (weighted / totalSks.value).toFixed(2) : '-';
});

onMounted(async () => {
    await tahunStore.fetchAll();
    selectedYear.value = academicYears.value.find(item => item.is_active)?.id || academicYears.value[0]?.id || null;
});

watch(selectedYear, async id => {
    if (id) await store.fetchStudentGrades(id);
});

function openDetail(course) {
    selectedCourse.value = course;
    detailVisible.value = true;
}
</script>

<template>
    <div class="card">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
                <h1 class="text-2xl font-semibold m-0">Nilai Saya</h1>
                <p class="text-muted-color mt-2 mb-0">Nilai mata kuliah yang telah disetujui dan dipublikasikan.</p>
            </div>
            <Select v-model="selectedYear" :options="academicYears" optionLabel="nama" optionValue="id" class="w-60" />
        </div>

        <Message v-if="error" severity="error" class="mb-4">{{ error }}</Message>
        <div class="grid grid-cols-12 gap-4 mb-5">
            <div class="col-span-12 md:col-span-6 rounded border border-surface p-4">
                <div class="text-muted-color text-sm">SKS dengan nilai terbit</div>
                <div class="text-3xl font-semibold mt-1">{{ totalSks }}</div>
            </div>
            <div class="col-span-12 md:col-span-6 rounded border border-surface p-4">
                <div class="text-muted-color text-sm">Indeks semester dari nilai terbit</div>
                <div class="text-3xl font-semibold text-primary mt-1">{{ semesterIndex }}</div>
            </div>
        </div>

        <DataTable :value="grades" :loading="isLoading" paginator :rows="15" stripedRows>
            <Column field="kode_mk" header="Kode" />
            <Column field="nama_mk" header="Mata Kuliah" />
            <Column field="kelas" header="Kelas" />
            <Column field="sks" header="SKS" class="text-center" />
            <Column header="Nilai Angka" class="text-center"><template #body="{ data }"><b>{{ data.nilai_angka ?? '-' }}</b></template></Column>
            <Column header="Huruf" class="text-center"><template #body="{ data }"><Tag :value="data.nilai_huruf || '-'" :severity="data.nilai_huruf ? 'success' : 'secondary'" /></template></Column>
            <Column field="nilai_indeks" header="Indeks" class="text-center" />
            <Column header="Rincian"><template #body="{ data }"><Button label="Lihat Komponen" icon="pi pi-eye" text size="small" @click="openDetail(data)" /></template></Column>
            <template #empty><div class="text-center p-8">Belum ada nilai mata kuliah yang dipublikasikan pada periode ini.</div></template>
        </DataTable>
    </div>

    <Dialog v-model:visible="detailVisible" modal :style="{ width: '760px' }" :header="selectedCourse ? `Rincian Nilai · ${selectedCourse.kode_mk} ${selectedCourse.nama_mk}` : 'Rincian Nilai'">
        <div v-if="selectedCourse">
            <div class="flex flex-wrap gap-2 mb-4">
                <Tag :value="`Nilai ${selectedCourse.nilai_angka}`" severity="info" />
                <Tag :value="selectedCourse.nilai_huruf" severity="success" />
                <Tag :value="`Indeks ${selectedCourse.nilai_indeks}`" severity="secondary" />
            </div>
            <DataTable :value="selectedCourse.komponen" size="small" stripedRows>
                <Column field="jenis" header="Jenis" />
                <Column field="judul" header="Komponen" />
                <Column header="Bobot"><template #body="{ data }">{{ data.bobot }}%</template></Column>
                <Column field="nilai" header="Nilai" />
                <Column field="kontribusi" header="Kontribusi" />
                <template #empty><div class="text-center p-4">Rincian komponen belum tersedia.</div></template>
            </DataTable>
            <Message severity="info" class="mt-4">Kontribusi dihitung dari nilai komponen × bobot. Total kontribusi membentuk nilai akhir mata kuliah.</Message>
        </div>
    </Dialog>
</template>
