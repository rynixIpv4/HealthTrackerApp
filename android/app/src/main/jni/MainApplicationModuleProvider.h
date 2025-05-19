#pragma once

#include <memory>
#include <string>

#include <ReactCommon/TurboModule.h>

namespace facebook {
namespace react {

std::shared_ptr<TurboModule> MainApplicationModuleProvider(
    const std::string &name,
    const std::shared_ptr<CallInvoker> &jsInvoker);

} // namespace react
} // namespace facebook 