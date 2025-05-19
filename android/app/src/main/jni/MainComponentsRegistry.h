#pragma once

#include <ComponentFactory.h>
#include <fbjni/fbjni.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/components/rncore/ComponentDescriptors.h>

namespace facebook {
namespace react {

class MainComponentsRegistry
    : public facebook::jni::HybridClass<MainComponentsRegistry> {
 public:
  constexpr static auto kJavaDescriptor =
      "Lcom/healthtracker/MainComponentsRegistry;";

  static void registerNatives();

  MainComponentsRegistry();

  std::shared_ptr<ComponentDescriptorProviderRegistry const>
  sharedProviderRegistry();

 private:
  friend HybridBase;

  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jclass>);
};

} // namespace react
} // namespace facebook 