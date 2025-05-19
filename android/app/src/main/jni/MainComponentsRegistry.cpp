#include "MainComponentsRegistry.h"

namespace facebook {
namespace react {

MainComponentsRegistry::MainComponentsRegistry() {}

std::shared_ptr<ComponentDescriptorProviderRegistry const>
MainComponentsRegistry::sharedProviderRegistry() {
  auto providerRegistry = CoreComponentsRegistry::sharedProviderRegistry();
  return providerRegistry;
}

jni::local_ref<MainComponentsRegistry::jhybriddata>
MainComponentsRegistry::initHybrid(jni::alias_ref<jclass>) {
  auto instance = makeCxxInstance();
  return instance;
}

void MainComponentsRegistry::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", MainComponentsRegistry::initHybrid),
  });
}

} // namespace react
} // namespace facebook 