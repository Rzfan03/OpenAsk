import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore, PersonalityConfig } from '../../store/settingsStore';
import { Colors } from '../../constants/Colors';

const PRESETS = ['Default', 'Formal', 'Friendly', 'Sarkastik', 'Jenius'];

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
};

function SimpleSlider({ label, value, min, max, step, onChange }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  const marks = [];
  for (let v = min; v <= max; v += step * 5) {
    marks.push(v);
  }

  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.labelRow}>
        <Text style={sliderStyles.label}>{label}</Text>
        <Text style={sliderStyles.value}>{value.toFixed(step < 1 ? 1 : 0)}</Text>
      </View>
      <View style={sliderStyles.trackContainer}>
        <View style={sliderStyles.track}>
          <View style={[sliderStyles.fill, { width: `${percentage}%` }]} />
        </View>
        <View style={sliderStyles.marks}>
          {marks.map((v, i) => (
            <TouchableOpacity
              key={i}
              style={[
                sliderStyles.mark,
                v <= value && sliderStyles.markActive,
              ]}
              onPress={() => onChange(Math.round(v / step) * step)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: { gap: 4 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 13, color: Colors.textSecondary },
  value: { fontSize: 13, fontWeight: '600', color: Colors.text },
  trackContainer: { height: 24, justifyContent: 'center', position: 'relative' },
  track: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  marks: { flexDirection: 'row', justifyContent: 'space-between', position: 'absolute', left: 0, right: 0, top: 8 },
  mark: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.border },
  markActive: { backgroundColor: Colors.primary },
});

export default function PersonalityScreen() {
  const router = useRouter();
  const { personality, setPersonalityField, setPreset, resetPersonality } = useSettingsStore();
  const [localPrompt, setLocalPrompt] = useState(personality.systemPrompt);
  useEffect(() => {
    setLocalPrompt(personality.systemPrompt);
  }, [personality.systemPrompt]);

  const handleSavePrompt = useCallback(() => {
    setPersonalityField('systemPrompt', localPrompt);
  }, [localPrompt, setPersonalityField]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personality</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Presets */}
        <Text style={styles.sectionTitle}>Presets</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetRow}>
          {PRESETS.map((name) => {
            const active = personality.activePreset === name;
            return (
              <TouchableOpacity
                key={name}
                style={[styles.presetChip, active && styles.presetChipActive]}
                onPress={() => setPreset(name)}
              >
                <Text style={[styles.presetText, active && styles.presetTextActive]}>
                  {name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* System Prompt */}
        <Text style={styles.sectionTitle}>System Prompt</Text>
        <TextInput
          style={styles.promptInput}
          value={localPrompt}
          onChangeText={setLocalPrompt}
          onBlur={handleSavePrompt}
          multiline
          placeholder="Custom instructions for the AI..."
          placeholderTextColor={Colors.textTertiary}
          textAlignVertical="top"
        />

        {/* Parameters */}
        <Text style={styles.sectionTitle}>Parameters</Text>
        <View style={styles.card}>
          <SimpleSlider
            label="Temperature"
            value={personality.temperature}
            min={0}
            max={2}
            step={0.1}
            onChange={(v) => setPersonalityField('temperature', v)}
          />
          <View style={styles.sep} />
          <SimpleSlider
            label="Max Tokens"
            value={personality.maxTokens}
            min={256}
            max={8192}
            step={256}
            onChange={(v) => setPersonalityField('maxTokens', v)}
          />
          <View style={styles.sep} />
          <SimpleSlider
            label="Top P"
            value={personality.topP}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => setPersonalityField('topP', v)}
          />
          <View style={styles.sep} />
          <SimpleSlider
            label="Frequency Penalty"
            value={personality.frequencyPenalty}
            min={0}
            max={2}
            step={0.1}
            onChange={(v) => setPersonalityField('frequencyPenalty', v)}
          />
        </View>

        {/* Reset */}
        <TouchableOpacity style={styles.resetBtn} onPress={() => { resetPersonality(); }}>
          <Ionicons name="refresh-outline" size={16} color={Colors.error} />
          <Text style={styles.resetText}>Reset to Default</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  scroll: { padding: 16, gap: 8, paddingBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 4 },
  presetRow: { marginBottom: 8 },
  presetChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  presetChipActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}15` },
  presetText: { fontSize: 13, fontWeight: '500', color: Colors.text },
  presetTextActive: { color: Colors.primary },
  promptInput: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, fontSize: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border, minHeight: 120, lineHeight: 20 },
  card: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.border },
  sep: { height: 1, backgroundColor: Colors.border },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, padding: 12 },
  resetText: { fontSize: 14, color: Colors.error, fontWeight: '500' },
});
