#include "MainApplicationModuleProvider.h"

namespace facebook {
namespace react {

std::shared_ptr<TurboModule> MainApplicationModuleProvider(
    const std::string &name,
    const std::shared_ptr<CallInvoker> &jsInvoker) {
  // Here you can provide your own module provider
  return nullptr;
}

} // namespace react
} // namespace facebook 